/**
 * @fileoverview Converts all Markdown (.md) files in a specified Google Drive folder 
 * into Google Docs.
 *
 * INSTRUCTIONS:
 * 1. Replace 'YOUR_FOLDER_ID_HERE' with the actual ID of the Google Drive folder.
 * 2. Configure 'COMBINE_INTO_SINGLE_DOC':
 * - TRUE: Merges all contents into one Google Doc, separated by page breaks and headings.
 * - FALSE: Creates a separate Google Doc file for each Markdown file.
 * 3. Run 'convertMarkdownToDocs'.
 */

// Helper function to safely get the UI object, falling back to null if no container is active.
function getUi() {
  try {
    // Attempt to get the UI from the current container (Sheet, Doc, Form)
    return SpreadsheetApp.getUi() || DocumentApp.getUi() || FormApp.getUi();
  } catch (e) {
    // Return null if the script is running in a context without a UI (e.g., standalone or editor).
    return null;
  }
}

// Helper function to show a message via the UI if available, or log it otherwise.
function showStatusMessage(title, message) {
  const ui = getUi();
  if (ui) {
    // Use the container's UI alert
    ui.alert(title, message, ui.ButtonSet.OK);
  } else {
    // Fallback to Logger.log for standalone execution or running from the editor
    Logger.log(`${title}: ${message}`);
  }
}

function convertMarkdownToDocs() {
  // *** 1. CONFIGURATION ***
  const SOURCE_FOLDER_ID = 'YOUR_FOLDER_ID_HERE'; 
  const DEST_FOLDER_ID = 'YOUR_DEST_FOLDER_ID_HERE'; 
  
  // Set to TRUE to merge all files into one Doc with tabs/headings. 
  // Set to FALSE to create individual Docs for each file.
  const COMBINE_INTO_SINGLE_DOC = false; 
  
  if (SOURCE_FOLDER_ID === 'YOUR_FOLDER_ID_HERE' || DEST_FOLDER_ID === 'YOUR_DEST_FOLDER_ID_HERE') {
    const errorMessage = 'Please update both SOURCE_FOLDER_ID and DEST_FOLDER_ID constants in the script.';
    Logger.log("ERROR: " + errorMessage);
    showStatusMessage('Configuration Error', errorMessage);
    return;
  }

  try {
    const sourceFolder = DriveApp.getFolderById(SOURCE_FOLDER_ID);
    const destFolder = DriveApp.getFolderById(DEST_FOLDER_ID);
    
    // Fetch all plain text files, as .md is treated as plain text
    const mdFiles = sourceFolder.getFilesByType(MimeType.PLAIN_TEXT);
    let convertedCount = 0;
    let singleDoc = null;
    let singleDocBody = null;

    Logger.log(`Starting conversion from: ${sourceFolder.getName()} (ID: ${SOURCE_FOLDER_ID})`);
    Logger.log(`Destination folder: ${destFolder.getName()} (ID: ${DEST_FOLDER_ID})`);

    // Prepare the single document if the flag is enabled
    if (COMBINE_INTO_SINGLE_DOC) {
      const timestamp = new Date().toLocaleString();
      const combinedTitle = `Combined Markdown Imports (${timestamp})`;
      singleDoc = DocumentApp.create(combinedTitle);
      singleDocBody = singleDoc.getBody();
      // Clear default empty paragraph
      singleDocBody.setText('');
      Logger.log(`Created combined document: "${combinedTitle}"`);
    }

    // 2. Iterate through all plain text files in the source folder
    while (mdFiles.hasNext()) {
      const file = mdFiles.next();
      let fileName = file.getName();
      
      // --- RENAMING LOGIC START ---
      // Check if the file is .txt or has no extension, and rename it to .md
      if (fileName.toLowerCase().endsWith('.txt')) {
        const newName = fileName.replace(/\.txt$/i, '.md');
        file.setName(newName);
        Logger.log(`Renamed .txt file: "${fileName}" to "${newName}"`);
        fileName = newName; 
      } else if (fileName.indexOf('.') === -1) {
        const newName = fileName + '.md';
        file.setName(newName);
        Logger.log(`Renamed no-extension file: "${fileName}" to "${newName}"`);
        fileName = newName; 
      }
      // --- RENAMING LOGIC END ---

      // Check if the file has the .md extension (case insensitive)
      if (fileName.toLowerCase().endsWith('.md')) {
        
        // 3. Read the content of the Markdown file
        const content = file.getBlob().getDataAsString();
        
        if (COMBINE_INTO_SINGLE_DOC) {
          // --- SINGLE DOC MODE ---
          
          // Add a page break if this is not the first file
          if (convertedCount > 0) {
            singleDocBody.appendPageBreak();
          }

          // Add the Filename as a Heading 1 (Creates a navigation item in Document Outline)
          singleDocBody.appendParagraph(fileName)
                       .setHeading(DocumentApp.ParagraphHeading.HEADING1);
          
          // Add the file content
          singleDocBody.appendParagraph(content);
          
          Logger.log(`Appended: "${fileName}" to combined doc.`);

        } else {
          // --- INDIVIDUAL DOCS MODE ---
          
          const newDocTitle = fileName.replace(/\.md$/i, '');
          const newDoc = DocumentApp.create(newDocTitle);
          const docFile = DriveApp.getFileById(newDoc.getId());
          
          newDoc.getBody().setText(content);
          newDoc.saveAndClose();

          // Move to destination folder
          try {
              DriveApp.getRootFolder().removeFile(docFile);
          } catch (e) {
            // DocumentApp.create creates files in the root folder, so we remove it from there.
            // If it's not in the root, this might fail, which is okay.
          }
          destFolder.addFile(docFile);
          
          Logger.log(`Converted: "${fileName}" to "${newDocTitle}" in destination folder.`);
        }

        convertedCount++;
      }
    }

    // Finalize Single Doc if used
    if (COMBINE_INTO_SINGLE_DOC && singleDoc) {
      singleDoc.saveAndClose();
      const combinedFile = DriveApp.getFileById(singleDoc.getId());
      try {
          DriveApp.getRootFolder().removeFile(combinedFile);
      } catch (e) {}
      destFolder.addFile(combinedFile);
      Logger.log(`Moved combined document to destination folder.`);
    }

    if (convertedCount === 0) {
      showStatusMessage('Conversion Status', 'Conversion complete. No valid files were found in the source folder.');
      Logger.log('No files processed.');
    } else {
      const modeMsg = COMBINE_INTO_SINGLE_DOC ? "merged into a single document" : "converted into individual Google Docs";
      showStatusMessage('Conversion Complete', `Successfully processed ${convertedCount} file(s) from source to destination and ${modeMsg}.`);
      Logger.log(`Conversion complete! Total files processed: ${convertedCount}`);
    }

  } catch (e) {
    const errorMessage = `An error occurred during conversion: ${e.message}. Check the Logs (View > Logs) for details.`;
    Logger.log(`Fatal Error during conversion: ${e.toString()}`);
    showStatusMessage('Runtime Error', errorMessage);
  }
}


/**
 * Adds a custom menu item to the sheet/doc menu for easy execution.
 * This function only runs if the script is bound to a Google Sheet, Doc, or Form.
 */
function onOpen() {
  const ui = getUi();
  if (ui) {
    ui.createMenu('Markdown Converter')
        .addItem('Run Conversion', 'convertMarkdownToDocs')
        .addToUi();
  }
}