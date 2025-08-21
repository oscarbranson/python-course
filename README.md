# Python for Earth Sciences Course

A comprehensive, modular Python course designed specifically for scientific computing in Earth Sciences. This course features an interactive web interface with progress tracking, search functionality, and dependency visualization.

## Course Features

### 🎯 **Modular Structure**
- **Core Foundation**: Python basics, NumPy, Pandas, plotting
- **Intermediate Skills**: Statistical analysis, file I/O, time series
- **Advanced Applications**: Geospatial analysis, climate data, machine learning
- **Specialized Modules**: Seismology, oceanography, geochemistry, remote sensing

### 🌐 **Interactive Website**
- **Module Browser**: Search and filter modules by category, difficulty, and keywords
- **Dependency Graph**: Interactive visualization showing module prerequisites and pathways
- **Progress Tracking**: User authentication and completion tracking
- **Responsive Design**: Works on desktop and mobile devices

### 📊 **Graph Visualization**
- **D3.js Network Graph**: Interactive dependency visualization
- **Node Information**: Click nodes to see module details and prerequisites
- **Color Coding**: Visual distinction between difficulty levels
- **Path Exploration**: Discover learning pathways and recommended sequences

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/oscarbranson/python-course.git
cd python-course

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Application

```bash
# Start the Flask development server
python app.py
```

Visit `http://localhost:5000` to access the course website.

### 3. Access Jupyter Notebooks

```bash
# Start Jupyter Notebook server
jupyter notebook modules/
```

## Course Modules

### Core Foundation (Prerequisites for all advanced modules)
1. **Python Basics** - Variables, data types, control structures (30 min)
2. **Working with Arrays** - NumPy fundamentals, array operations (35 min)
3. **Data Handling** - Pandas basics, reading/writing data (40 min)
4. **Basic Plotting** - Matplotlib fundamentals, simple visualizations (30 min)

### Intermediate Skills
5. **Advanced Plotting** - Seaborn, interactive plots, map projections (35 min)
6. **Statistical Analysis** - Scipy.stats, hypothesis testing, distributions (40 min)
7. **File I/O & Formats** - NetCDF, HDF5, CSV, JSON for geoscience data (35 min)
8. **Time Series Analysis** - Datetime handling, resampling, trend analysis (40 min)

### Advanced/Specialized Modules
9. **Geospatial Analysis** - Cartopy, rasterio, vector data (40 min)
10. **Climate Data Analysis** - ECMWF, NOAA data, climate indices (40 min)
11. **Geochemistry** - Phase diagrams, thermodynamic calculations (35 min)
12. **Seismology** - ObsPy, earthquake data analysis (40 min)
13. **Oceanography** - CTD data, current analysis, ADCP processing (40 min)
14. **Atmospheric Science** - Meteorological data, atmospheric profiles (35 min)
15. **Remote Sensing** - Satellite data processing, spectral analysis (40 min)
16. **Machine Learning for Earth Sciences** - Classification, regression, clustering (40 min)
17. **Modeling & Simulation** - Numerical methods, differential equations (40 min)
18. **Data Visualization** - Advanced plotting, interactive dashboards (35 min)
19. **Reproducible Research** - Version control, documentation, publishing (30 min)

## Website Architecture

### Frontend
- **HTML5/CSS3/JavaScript**: Responsive web interface
- **Bootstrap 5**: Modern UI components and grid system
- **D3.js**: Interactive graph visualization
- **Font Awesome**: Icon library

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: Database ORM for user and progress management
- **Flask-Login**: User authentication and session management
- **SQLite**: Lightweight database for development

### Database Schema
- **Users**: Authentication and profile information
- **Modules**: Course content metadata and structure
- **Prerequisites**: Module dependency relationships
- **Progress**: User completion tracking and scoring

## Interactive Graph Features

### Visualization Components
- **Nodes**: Represent individual modules
- **Edges**: Show prerequisite relationships
- **Color Coding**: Difficulty levels (beginner/intermediate/advanced)
- **Interactive Selection**: Click to view module details

### Navigation Features
- **Prerequisite Highlighting**: Shows required modules in green
- **Dependency Highlighting**: Shows dependent modules in red
- **Path Discovery**: Explore learning pathways through the course
- **Module Information Panel**: Detailed module information on selection

### Search and Filter
- **Text Search**: Search module titles, descriptions, and keywords
- **Category Filter**: Filter by subject area (core, geoscience, climate, etc.)
- **Real-time Results**: Instant filtering as you type
- **Keyword Tags**: Visual keyword representation for each module

## User Features

### Authentication System
- **User Registration**: Create account with email/password
- **Login/Logout**: Secure session management
- **Progress Persistence**: Completion status saved per user

### Progress Tracking
- **Module Status**: Not started, in progress, completed
- **Completion Timestamps**: Track when modules are finished
- **Score Recording**: Optional scoring for assessments
- **Visual Indicators**: Progress badges and completion icons

### Personalization
- **Dashboard View**: Overview of completed and recommended modules
- **Next Steps**: Suggested modules based on completed prerequisites
- **Learning Path**: Customized pathway recommendations

## Development and Customization

### Adding New Modules

1. **Create Jupyter Notebook**: Add notebook to `modules/` directory
2. **Update Course Structure**: Add module metadata to `course_structure.json`
3. **Define Prerequisites**: Specify required modules in the JSON structure
4. **Restart Application**: Flask will automatically load new modules

### Customizing the Interface

- **Styling**: Modify CSS in `website/index.html`
- **Layout**: Adjust Bootstrap grid and components
- **Colors**: Update color schemes in CSS and D3.js configuration
- **Features**: Add new functionality in `website/js/app.js`

### Database Management

```python
# Initialize database
python -c "from app import app, init_database; app.app_context().push(); init_database()"

# Reset database
python -c "from app import app, db; app.app_context().push(); db.drop_all(); db.create_all()"
```

## Future Enhancements

### Planned Features
- **JupyterHub Integration**: Embedded notebook execution
- **Assessment System**: Automated quizzes and code evaluation
- **Discussion Forums**: Community interaction and Q&A
- **Video Integration**: Supplementary video content
- **Mobile App**: Native mobile application

### Advanced Analytics
- **Learning Analytics**: Track user progress and engagement
- **Recommendation Engine**: AI-powered module suggestions
- **Completion Predictions**: Estimate time to course completion
- **Difficulty Assessment**: Dynamic difficulty adjustment

### Content Expansion
- **Language Support**: Multi-language course content
- **Domain Specialization**: Additional Earth science subfields
- **Industry Applications**: Professional case studies
- **Research Integration**: Current research examples and datasets

## Contributing

We welcome contributions to improve the course content and platform!

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Add new modules or improve existing content
4. Submit a pull request

### Content Guidelines
- **Duration**: Keep modules between 20-40 minutes
- **Practical Focus**: Include real Earth science examples
- **Clear Prerequisites**: Specify required knowledge
- **Interactive Elements**: Include exercises and examples

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support:
- **Issues**: Report bugs or request features on GitHub
- **Documentation**: Check the wiki for detailed guides
- **Community**: Join discussions in the repository

---

*Built with ❤️ for the Earth Sciences community*
