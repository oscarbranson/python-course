from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///course.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to progress
    progress = db.relationship('ModuleProgress', backref='user', lazy=True)

class Module(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # minutes
    level = db.Column(db.String(20), nullable=False)  # beginner, intermediate, advanced
    category = db.Column(db.String(50), nullable=False)
    keywords = db.Column(db.Text, nullable=False)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ModulePrerequisite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.String(50), db.ForeignKey('module.id'), nullable=False)
    prerequisite_id = db.Column(db.String(50), db.ForeignKey('module.id'), nullable=False)

class ModuleProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    module_id = db.Column(db.String(50), db.ForeignKey('module.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # not-started, in-progress, completed
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    score = db.Column(db.Float)  # optional scoring

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/modules')
def get_modules():
    # Handle search parameters in the same endpoint
    query = request.args.get('q', '').lower()
    category = request.args.get('category', '')
    
    modules_query = Module.query
    
    if category:
        modules_query = modules_query.filter_by(category=category)
    
    if query:
        modules_query = modules_query.filter(
            db.or_(
                Module.title.ilike(f'%{query}%'),
                Module.description.ilike(f'%{query}%'),
                Module.keywords.ilike(f'%{query}%')
            )
        )
    
    modules = modules_query.all()
    module_list = []
    
    for module in modules:
        # Get prerequisites
        prereqs = db.session.query(ModulePrerequisite.prerequisite_id).filter_by(module_id=module.id).all()
        prerequisites = [p[0] for p in prereqs]
        
        # Get user progress if logged in
        progress_status = 'not-started'
        if current_user.is_authenticated:
            progress = ModuleProgress.query.filter_by(user_id=current_user.id, module_id=module.id).first()
            if progress:
                progress_status = progress.status
        
        module_data = {
            'id': module.id,
            'title': module.title,
            'description': module.description,
            'duration': module.duration,
            'level': module.level,
            'category': module.category,
            'keywords': json.loads(module.keywords),
            'prerequisites': prerequisites,
            'status': progress_status
        }
        module_list.append(module_data)
    
    return jsonify({'modules': module_list})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        email=data['email'],
        name=data['name'],
        password_hash=generate_password_hash(data['password'])
    )
    
    db.session.add(user)
    db.session.commit()
    
    login_user(user)
    return jsonify({'message': 'User created successfully', 'user': {'id': user.id, 'name': user.name, 'email': user.email}})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        login_user(user, remember=data.get('remember', False))
        return jsonify({'message': 'Login successful', 'user': {'id': user.id, 'name': user.name, 'email': user.email}})
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/progress', methods=['GET', 'POST'])
@login_required
def handle_progress():
    if request.method == 'GET':
        # Get user's progress
        progress_records = ModuleProgress.query.filter_by(user_id=current_user.id).all()
        progress = {p.module_id: {'status': p.status, 'score': p.score} for p in progress_records}
        return jsonify({'progress': progress})
    
    elif request.method == 'POST':
        # Update progress
        data = request.get_json()
        module_id = data['module_id']
        status = data['status']
        score = data.get('score')
        
        progress = ModuleProgress.query.filter_by(user_id=current_user.id, module_id=module_id).first()
        
        if progress:
            progress.status = status
            if score is not None:
                progress.score = score
            if status == 'completed':
                progress.completed_at = datetime.utcnow()
        else:
            progress = ModuleProgress(
                user_id=current_user.id,
                module_id=module_id,
                status=status,
                score=score,
                started_at=datetime.utcnow() if status == 'in-progress' else None,
                completed_at=datetime.utcnow() if status == 'completed' else None
            )
            db.session.add(progress)
        
        db.session.commit()
        return jsonify({'message': 'Progress updated'})

def init_database():
    """Initialize database with sample data"""
    db.create_all()
    
    # Load course structure from JSON
    if os.path.exists('course_structure.json'):
        with open('course_structure.json', 'r') as f:
            data = json.load(f)
        
        # Add modules
        for module_data in data['modules']:
            if not Module.query.get(module_data['id']):
                module = Module(
                    id=module_data['id'],
                    title=module_data['title'],
                    description=module_data['description'],
                    duration=module_data['duration'],
                    level=module_data['level'],
                    category=module_data['category'],
                    keywords=json.dumps(module_data['keywords'])
                )
                db.session.add(module)
        
        db.session.commit()
        
        # Add prerequisites
        for module_data in data['modules']:
            for prereq_id in module_data['prerequisites']:
                if not ModulePrerequisite.query.filter_by(
                    module_id=module_data['id'], 
                    prerequisite_id=prereq_id
                ).first():
                    prereq = ModulePrerequisite(
                        module_id=module_data['id'],
                        prerequisite_id=prereq_id
                    )
                    db.session.add(prereq)
        
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        init_database()
    app.run(debug=True)
