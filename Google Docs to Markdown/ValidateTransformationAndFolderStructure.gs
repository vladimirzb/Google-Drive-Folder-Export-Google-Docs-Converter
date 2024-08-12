function ValidateTransformationAndFolderStructure() {
  const originalFolderId = "###"; // Please set the folder ID of the original folder.
  const transformedFolderId = "###"; // Please set the folder ID of the transformed folder.

  const originalFolder = DriveApp.getFolderById(originalFolderId);
  const transformedFolder = DriveApp.getFolderById(transformedFolderId);

  const missingFiles = []; // Array to hold any missing files

  // Start the comparison
  Logger.log('Starting validation process...');
  compareFolders(originalFolder, transformedFolder, missingFiles);

  // Log the result
  if (missingFiles.length > 0) {
    Logger.log('Validation completed. The following files are missing:');
    missingFiles.forEach(file => Logger.log(file));
  } else {
    Logger.log('Validation completed. All files are present and accounted for.');
  }
}

function compareFolders(originalFolder, transformedFolder, missingFiles, path = '') {
  // Get all files and folders in the original folder
  const originalFiles = originalFolder.getFiles();
  const originalFolders = originalFolder.getFolders();

  // Log the current path being compared
  Logger.log(`Comparing folder: ${path}/${originalFolder.getName()}`);

  // Compare files in the current folder
  while (originalFiles.hasNext()) {
    const originalFile = originalFiles.next();
    const originalFileName = originalFile.getName();

    // Log the file being checked
    Logger.log(`Checking file: ${path}/${originalFileName}`);

    // Assume that if the original file is a Google Doc, it was converted to a Markdown (.md) file
    const transformedFileName = originalFile.getMimeType() === MimeType.GOOGLE_DOCS
      ? originalFileName.replace(/\.gdoc$/, '') + " (Converted from Google Doc).md"
      : originalFileName;

    // Check if the file exists in the transformed folder
    const transformedFileIterator = transformedFolder.getFilesByName(transformedFileName);
    if (!transformedFileIterator.hasNext()) {
      // If the file is missing, add it to the missingFiles array
      Logger.log(`File missing: ${path}/${originalFileName}`);
      missingFiles.push(`${path}/${originalFileName}`);
    }
  }

  // Recursively compare subfolders
  while (originalFolders.hasNext()) {
    const originalSubFolder = originalFolders.next();
    const originalSubFolderName = originalSubFolder.getName();

    // Check if the corresponding subfolder exists in the transformed folder
    const transformedSubFolderIterator = transformedFolder.getFoldersByName(originalSubFolderName);
    if (transformedSubFolderIterator.hasNext()) {
      const transformedSubFolder = transformedSubFolderIterator.next();
      compareFolders(originalSubFolder, transformedSubFolder, missingFiles, `${path}/${originalSubFolderName}`);
    } else {
      // If the subfolder is missing, all its contents are considered missing
      Logger.log(`Subfolder missing: ${path}/${originalSubFolderName}`);
      const missingSubFolderFiles = listAllFiles(originalSubFolder, `${path}/${originalSubFolderName}`);
      missingFiles.push(...missingSubFolderFiles);
    }
  }

  Logger.log(`Finished comparing folder: ${path}/${originalFolder.getName()}`);
}

function listAllFiles(folder, path = '') {
  const files = folder.getFiles();
  const folders = folder.getFolders();
  const allFiles = [];

  // Add all files in the current folder to the list
  while (files.hasNext()) {
    const file = files.next();
    allFiles.push(`${path}/${file.getName()}`);
  }

  // Recursively add all files in subfolders
  while (folders.hasNext()) {
    const subFolder = folders.next();
    const subFolderPath = `${path}/${subFolder.getName()}`;
    allFiles.push(...listAllFiles(subFolder, subFolderPath));
  }

  return allFiles;
}

