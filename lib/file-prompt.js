const fs = require('fs-extra');
const tmp = require('tmp');
const cp = require('child-process-promise');
const pupa = require('pupa');

module.exports = async function filePrompt(options = {}) {
  let {file, contents, templateFile, templateData} = options;
  if (!file) {
    file = tmp.fileSync().name;
  }
  if (templateFile) {
    contents = await fs.readFile(templateFile);
    if (templateData) {
      contents = pupa(contents.toString(), templateData);
    }
  }
  const editor = process.env.EDITOR || 'vi';
  if (contents) {
    await fs.writeFile(file, contents);
  }

  await cp.spawn(editor, [file], {
    stdio: 'inherit',
  });

  const fileContents = await fs.readFile(file);

  await fs.remove(file);

  return fileContents.toString();
};
