#!/usr/bin/env python3
"""
Script to create placeholder notebooks for all course modules.
Run this script to generate .ipynb files for modules that don't have notebooks yet.
"""

import json
import os

# Basic notebook template
NOTEBOOK_TEMPLATE = {
    "cells": [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": []
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "# Welcome to {title}!\n",
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Summary\n",
                "\n",
                "This notebook covers {title}.\n",
                "\n",
                "**Duration:** {duration} minutes  \n",
                "**Level:** {level}  \n",
                "**Prerequisites:** {prerequisites}\n",
                "\n",
                "## Learning Objectives\n",
                "\n",
                "- Understand {title} concepts\n",
                "- Apply techniques to earth science problems\n",
                "\n",
                "---\n",
                "\n",
                "*This notebook is part of the Python for Earth Sciences course.*"
            ]
        }
    ],
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "codemirror_mode": {
                "name": "ipython",
                "version": 3
            },
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.8.0"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 4
}

def create_notebook(module_info, output_dir="notebooks"):
    """Create a notebook file for a module."""
    notebook = NOTEBOOK_TEMPLATE.copy()
    
    # Fill in the template with module information
    title = module_info['title']
    module_id = module_info['id']
    duration = module_info['duration']
    level = module_info['level']
    prerequisites = ', '.join(module_info['prerequisites']) if module_info['prerequisites'] else 'None'
    
    # Update the markdown cells
    notebook['cells'][0]['source'] = [
        f"# {title}\n",
        "\n",
        "## Learning Objectives\n",
        f"- Learn about {title.lower()}\n",
        "- Apply concepts to earth science problems\n",
        "\n",
        "## Prerequisites\n",
        f"{prerequisites}\n",
        "\n",
        f"**Duration:** {duration} minutes  \n",
        f"**Level:** {level.title()}\n",
        "\n",
        "---"
    ]
    
    # Update code cell
    notebook['cells'][1]['source'] = [
        f"# Welcome to {title}!\n",
        f"print('Starting {title} module...')\n",
        "\n",
        "# Import common libraries\n",
        "import numpy as np\n",
        "import pandas as pd\n",
        "import matplotlib.pyplot as plt"
    ]
    
    # Update summary cell
    notebook['cells'][2]['source'] = [
        "## Summary\n",
        "\n",
        f"This notebook covers **{title}**.\n",
        "\n",
        f"**Duration:** {duration} minutes  \n",
        f"**Level:** {level}  \n",
        f"**Prerequisites:** {prerequisites}\n",
        "\n",
        "## Learning Objectives\n",
        "\n",
        f"- Understand {title.lower()} concepts\n",
        "- Apply techniques to earth science problems\n",
        f"- Work with {', '.join(module_info['keywords'][:3])}\n",
        "\n",
        "---\n",
        "\n",
        "*This notebook is part of the Python for Earth Sciences course.*"
    ]
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Write notebook file
    output_file = os.path.join(output_dir, f"{module_id}.ipynb")
    
    # Only create if file doesn't exist
    if not os.path.exists(output_file):
        with open(output_file, 'w') as f:
            json.dump(notebook, f, indent=2)
        print(f"Created: {output_file}")
    else:
        print(f"Skipped: {output_file} (already exists)")

def main():
    """Generate notebooks for all modules in course_structure.json"""
    
    # Load course structure
    try:
        with open('course_structure.json', 'r') as f:
            course_data = json.load(f)
    except FileNotFoundError:
        print("Error: course_structure.json not found!")
        return
    
    print("Generating notebook files...")
    print("=" * 40)
    
    for module in course_data['modules']:
        create_notebook(module)
    
    print("=" * 40)
    print("Done! Notebook files created in the 'notebooks' directory.")
    print("\nExisting notebooks were not overwritten.")
    print("You can now:")
    print("1. Download .ipynb files directly from the web interface")
    print("2. Open notebooks in Google Colab with one click")
    print("3. Edit and customize the notebook content")

if __name__ == "__main__":
    main()
