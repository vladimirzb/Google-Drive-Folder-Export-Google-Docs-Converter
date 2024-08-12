function sample1() {
  const isItFirstPass = false; // Set to true if you want to start over, false to continue from where it left off.

  const srcFolderId = "###"; // Please set the folder ID of the folder including Google Documents.
  const dstFolderId = "###"; // Please set the destination folder ID.

  const token = ScriptApp.getOAuthToken();
  const srcFolder = DriveApp.getFolderById(srcFolderId);
  const dstFolder = DriveApp.getFolderById(dstFolderId);

  const properties = PropertiesService.getScriptProperties();

  if (isItFirstPass) {
    // If this is the first pass, delete the properties to start fresh.
    Logger.log('First pass detected. Deleting properties to start fresh.');
    properties.deleteProperty('lastProcessedIndex');
  } else {
    Logger.log('Continuing from the last saved state.');
  }

  // Get the last processed index from the properties service
  const lastProcessedIndex = parseInt(properties.getProperty('lastProcessedIndex'), 10) || 0;

  // Debug: Log the last processed index
  Logger.log('Starting process...');
  Logger.log('Last processed index: ' + lastProcessedIndex);

  // Start copying folder contents from the source to the destination
  let updatedIndex = copyFolderContents(srcFolder, dstFolder, token, lastProcessedIndex, 0);

  Logger.log('Process completed. Final index: ' + updatedIndex);
  properties.setProperty('lastProcessedIndex', updatedIndex);
}

function copyFolderContents(srcFolder, dstFolder, token, lastProcessedIndex, currentIndex) {
  const files = srcFolder.getFiles();
  const folders = srcFolder.getFolders();

  // Debug: Log folder being processed
  Logger.log('Processing folder: ' + srcFolder.getName());

  // Process all files in the current folder
  while (files.hasNext()) {
    const file = files.next();
    const mimeType = file.getMimeType();
    const fileName = file.getName();

    // Ensure we skip all files up to the last processed index
    if (currentIndex <= lastProcessedIndex) {
      Logger.log('Skipping file (already processed): ' + fileName + ' at index: ' + currentIndex);
      currentIndex++;
      continue;
    }

    // Debug: Log the current file name and its MIME type
    Logger.log('Processing file: ' + fileName + ' (MIME type: ' + mimeType + ') at index: ' + currentIndex);

    // Skip specific file"
    if (fileName === "name file you want to skip") {
      Logger.log('Skipping file: ' + fileName);
      currentIndex++;
      continue;
    }

    // Process Google Docs files
    if (mimeType === MimeType.GOOGLE_DOCS) {
      try {
        const documentId = file.getId();
        const url = `https://docs.google.com/feeds/download/documents/export/Export?exportFormat=pdf&id=${documentId}`;
        Logger.log('Converting Google Doc to PDF: ' + fileName);
        const res = UrlFetchApp.fetch(url, { headers: { authorization: "Bearer " + token } });
        const blob = res.getBlob().setName(fileName + " (Converted from Google Doc).pdf").setContentTypeFromExtension();
        dstFolder.createFile(blob);
        Logger.log('Converted and copied Google Doc: ' + fileName);
      } catch (error) {
        Logger.log('Error converting Google Doc: ' + fileName + ' - ' + error.message);
      }
    } else {
      // Copy non-Google Docs files directly
      try {
        Logger.log('Copying file: ' + fileName);
        file.makeCopy(fileName, dstFolder);
        Logger.log('Copied file: ' + fileName);
      } catch (error) {
        Logger.log('Error copying file: ' + fileName + ' - ' + error.message);
      }
    }

    // Store the index of the last processed file
    currentIndex++;
    PropertiesService.getScriptProperties().setProperty('lastProcessedIndex', currentIndex);
    Logger.log('Stored last processed index: ' + currentIndex);
  }

  // Process all subfolders in the current folder
  while (folders.hasNext()) {
    const subFolder = folders.next();
    let newDstFolder;

    // Debug: Log the subfolder being processed
    Logger.log('Processing subfolder: ' + subFolder.getName());

    // Check if the destination folder already exists
    const dstFolderIterator = dstFolder.getFoldersByName(subFolder.getName());
    if (dstFolderIterator.hasNext()) {
      Logger.log('Destination subfolder already exists: ' + subFolder.getName());
      newDstFolder = dstFolderIterator.next();
    } else {
      Logger.log('Creating new destination subfolder: ' + subFolder.getName());
      newDstFolder = dstFolder.createFolder(subFolder.getName());
    }

    // Process the contents of the subfolder
    currentIndex = copyFolderContents(subFolder, newDstFolder, token, lastProcessedIndex, currentIndex);

    Logger.log('Finished processing subfolder: ' + subFolder.getName());
  }

  Logger.log('Finished processing folder: ' + srcFolder.getName());

  return currentIndex; // Return the updated index to ensure it continues correctly across all folders
}

function deleteProperties() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty('lastProcessedIndex');
  Logger.log('All properties deleted. The process can now be started from scratch.');
}
