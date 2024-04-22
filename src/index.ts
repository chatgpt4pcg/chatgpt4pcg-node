import fs from 'fs';
import parseArgs from 'minimist';
import path from 'path';

export type STAGE =
  | 'qualified'
  | 'raw'
  | 'intermediate'
  | 'levels'
  | 'images'
  | 'stability'
  | 'similarity'
  | 'diversity'
  | 'result';

export const RESULT_FOLDER_NAME = 'result';
export const LOG_FOLDER_NAME = 'logs';
const START_TIME = new Date().toISOString().replaceAll(':', '_').replaceAll('/', '_');

/**
 * This function will parse source folder arguments from the command line
 * @returns a path to the source folder
 */
export function parseSourceFolderArgument() {
  const args = parseArgs(process.argv.slice(2));
  const argv = args['_'].length > 0 ? args['_'][0] : args['s'];
  if (argv === undefined) {
    throw Error('Insufficient parameters to work with.');
  }
  return path.posix.resolve(argv + '/');
}

/**
 * This function will list all directories in the source folder
 * @param sourceFolderPath is a target folder to list all directories
 * @returns a list of directories
 */
export async function listAllDirs(sourceFolderPath: string) {
  const files = await fs.promises.readdir(sourceFolderPath);
  const directories = [];
  for (const file of files) {
    const fPath = path.posix.join(sourceFolderPath, file);
    const fileState = await fs.promises.stat(fPath);
    if (fileState.isDirectory() && !file.startsWith('.') && file !== LOG_FOLDER_NAME && file !== RESULT_FOLDER_NAME) {
      directories.push(file);
    }
  }
  return directories;
}

/**
 * This function will list all files in the source folder
 * @param sourceFolderPath is a target folder to list all files
 * @returns a list of files
 */
export async function listAllFiles(sourceFolderPath: string) {
  const files = await fs.promises.readdir(sourceFolderPath);
  const filesInDirectory = [];
  for (const file of files) {
    const fPath = path.posix.join(sourceFolderPath, file);
    const fileStat = await fs.promises.stat(fPath);
    const isDirectory = fileStat.isDirectory();
    const fileName = file.split('/')[file.split('/').length - 1];
    if (!isDirectory && !fileName.startsWith('.')) {
      filesInDirectory.push(fileName);
    }
  }
  return filesInDirectory;
}

/**
 * This function will list all characters (folder names) in the source folder
 * @param sourceFolderPath is a target folder to list all characters
 * @param stage is a stage name.
 * @returns a list of characters
 */
export async function listCharactersDirs(sourceFolderPath: string, stage: STAGE) {
  const filePath = path.posix.join(sourceFolderPath, stage);
  const characters = await listAllDirs(filePath);
  return characters;
}

/**
 * This function will create output folders in the same structure as the source folder
 * @param sourceFolderPath is a path to the source folder
 * @param outputFolderName is a name of the output folder
 * @param stage is a stage name
 * @returns a path to the output folder
 */
export async function createOutputFolder(sourceFolderPath: string, outputFolderName: string, stage: STAGE) {
  const pathArr = sourceFolderPath.split('/');
  const root = pathArr.slice(0, pathArr.length - 3).join('/');
  const team = pathArr[pathArr.length - 3];
  const folders = sourceFolderPath.split('/').slice(pathArr.length - 2);

  const outputDir = path.posix.join(root, team, outputFolderName);
  if (!fs.existsSync(outputDir)) {
    await fs.promises.mkdir(outputDir);
  }

  let currentDir = outputDir;
  for (const folder of folders) {
    if (folder === stage) {
      continue;
    }
    currentDir = path.posix.join(currentDir, folder);
    if (!fs.existsSync(currentDir)) {
      await fs.promises.mkdir(currentDir);
    }
  }
  return currentDir;
}

/**
 * This function will create a result folder in the source folder
 * @param sourceFolderPath is a path to the source folder
 * @returns a path to the result folder
 */
export async function createResultOutputFolder(sourceFolderPath: string) {
  const outputDir = path.posix.join(sourceFolderPath, RESULT_FOLDER_NAME);

  if (!fs.existsSync(outputDir)) {
    await fs.promises.mkdir(outputDir);
  }

  return outputDir;
}

/**
 * This function will create a log folder in the same structure as the source folder
 * @param sourceFolderPath is a path to the source folder
 * @returns a path to the log folder
 */
export async function createLogFolder(sourceFolderPath: string) {
  const outputDir = path.posix.join(sourceFolderPath, LOG_FOLDER_NAME);
  if (!fs.existsSync(outputDir)) {
    fs.promises.mkdir(outputDir);
  }
  return outputDir;
}

/**
 * This function will append a log to the log file and print it to the console
 * @param logFolderPath is a path to the log folder
 * @param stage is a stage name
 * @param log is a log message
 */
export async function appendLog(logFolderPath: string, stage: STAGE, log: string) {
  console.log(log);
  const logFilePath = path.posix.join(logFolderPath, `${stage}_log_${START_TIME}.txt`);
  if (!fs.existsSync(logFilePath)) {
    await fs.promises.writeFile(logFilePath, '');
  }

  await fs.promises.appendFile(logFilePath, `${log}\n`);
}
