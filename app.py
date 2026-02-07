import os
import time
import json
import glob
import re
from flask import Flask, request, jsonify, render_template

# Define the folder where generated files will be stored
UPLOAD_FOLDER = 'drawings'

# Initialize the Flask application
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload directory exists upon startup
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    print(f"Created directory: {UPLOAD_FOLDER}")

# --- Flask Routes ---

@app.route('/')
def index():
    """Serves the main HTML page (index.html) from the current directory."""
    # Serves the index.html file that the user will customize with JavaScript.
    return render_template('index.html')

@app.route('/most-recent')
def most_recent():
    """
    Finds and displays the name of the most recently saved file
    by comparing modification times (mtime).
    """
    try:
        # 1. Search for all files (excluding directories) in the upload folder
        all_files = glob.glob(os.path.join(app.config['UPLOAD_FOLDER'], '*'))
        
        # Filter out directories and only keep actual files
        files = [f for f in all_files if os.path.isfile(f)]
        
        if files:
            # 2. Find the file with the most recent modification time (mtime)
            most_recent_file_path = max(files, key=lambda x: int(re.search(r'\d+', x).group()))

        with open(most_recent_file_path, "r") as f:
            pixels = json.load(f)

        # 4. Render the page, passing the filename (or None) to the template
        return jsonify(pixels)

    except Exception as e:
        print(f"Error accessing most recent file: {e}")
        return jsonify({'message': f'Server error finding recent file.'}), 500


@app.route('/save-file', methods=['POST'])
def save_file():
    """Handles the POST request to save the file content."""
    try:
        # 1. Get the JSON data sent from the client
        data = request.get_json()
        # if not data or 'file_content' not in data:
        #     return jsonify({'message': 'Missing file_content in request body'}), 400

        # file_content = data['file_content']

        # 2. Create a unique filename based on the current timestamp
        timestamp = int(time.time() * 1000) # Millisecond timestamp
        filename = f"pixels_{timestamp}.json"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # 3. Write the content to the new file
        # Using 'w' for write mode, and 'utf-8' encoding for compatibility
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

        # 4. Return success response
        return jsonify({
            'message': f"Success! File saved as: {filename}",
            'filename': filename
        }), 200

    except Exception as e:
        # Log the error for debugging purposes
        print(f"An error occurred during file saving: {e}")
        # Return a server error response
        return jsonify({'message': f'Server error: Could not save file.'}), 500

# --- Run the application ---
if __name__ == '__main__':
    # Running on localhost port 5000 by default
    app.run(host="0.0.0.0", debug=True)