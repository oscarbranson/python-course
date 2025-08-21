#!/bin/bash
# Development setup script for Python Earth Sciences Course

echo "🌍 Setting up Python for Earth Sciences Course..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

# Initialize database
echo "🗄️ Setting up database..."
python -c "
from app import app, init_database
with app.app_context():
    init_database()
    print('Database initialized successfully!')
"

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the Flask app: python app.py"
echo "3. Open your browser to: http://localhost:5000"
echo ""
echo "To access Jupyter notebooks:"
echo "1. Start Jupyter: jupyter notebook modules/"
echo "2. Open any .ipynb file to begin learning"
