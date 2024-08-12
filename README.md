# Google Drive Folder Export & Google Docs Converter
## Introduction

Hi! I've created a tool that allows you to export any Google Drive folder while maintaining its subfolder structure and converting any Google Docs within it to a specific file format of your choice. This tool was born out of my need for better control over the conversion of Google Docs, as Google Drive tends to convert them to `.docx` files when downloaded, which doesn't always meet my needs. I often prefer formats like Markdown (`.md`) or PDF for their longevity, preservation capabilities, and universal compatibility with any reader.

## Features

- **Maintains Folder Structure:** The tool preserves the original folder and subfolder hierarchy when exporting.
- **Customizable Conversion:** Convert Google Docs to your preferred file format, such as Markdown (`.md`) or PDF (`.pdf`), or any other format supported by Google Apps Script.
- **Easy to Use:** Simply specify the source folder and destination folder in Google Drive, and the tool will do the rest.

## Acknowledgments

This tool wouldn't have been possible without the help of [Tanaike](https://stackoverflow.com/questions/78796231/how-to-automate-exporting-google-docs-to-markdown-using-google-apps-script), who provided invaluable assistance on Stack Overflow. Tanaike also shared an excellent [Medium article](https://medium.com/google-cloud/convert-google-document-to-markdown-and-vice-versa-using-google-apps-script-a05c86509db4) that documents the process of converting Google Docs to Markdown and vice versa using Google Apps Script.

## How to Use

1. **Set Up Google Apps Script:** Copy the code provided in this repository into a new Google Apps Script project.
2. **Configure the Script:**
   - Set the source folder ID (the folder you want to export).
   - Set the destination folder ID (the folder where you want the files to be saved).
   - Choose the desired file format for conversion (e.g., Markdown or PDF).
3. **Run the Script:** Execute the script, and it will recursively process the source folder, converting Google Docs and preserving the folder structure in the destination folder.

## Future Enhancements (If Enough Interest Appears)

- Support for additional file formats.
- Enhanced error handling and logging.
- A user-friendly interface for non-technical users.

## Contributions

Feel free to contribute to this project! If you have ideas for new features or improvements, please submit a pull request or open an issue.
