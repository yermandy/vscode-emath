// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

import * as texsvg from 'texsvg';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const imagesRoot = `${context.extensionPath}${path.sep}tmp${path.sep}`;

	// removes the images folder if it exists
	if (fs.existsSync(imagesRoot)) {
		fs.rmSync(imagesRoot, { recursive: true });
	}

	var imageId = 0;
		
	// creates the images folder
	fs.mkdirSync(imagesRoot);

	const disposable = vscode.languages.registerHoverProvider(["python", "cpp"], {
		async provideHover(document, position, token) {
			var text = document.lineAt(position).text;

			// if the line doesn't start with a comment symbol return null
			if (!text.trim().startsWith('#') && document.languageId === "python") {
				return null;
			}
			if (!text.trim().startsWith('//') && document.languageId === "cpp") {
				return null;
			}
			
			// match either one or two dollar signs
			// example: $x^2$ or $$x^2$$
			var regex = /\${1,2}([^$]+)\${1,2}/g;
			var match, substring = null;

			// find the math equation
			while (match = regex.exec(text)) {
				if (position.character >= match.index && position.character <= match.index + match[0].length) {
					substring = match[1];
					break;
				}
			}

			// if substring is null return null
			if (substring === null) {
				return null;
			}

			substring = substring.trim();

			// convert the text to svg
			var svg = await texsvg(substring);

			// make the svg white
			svg = svg.replace('<svg style="', '<svg style="color: white;');

			const outputName = `image_${imageId}.svg`;

			// get all files in the images folder
			const files = fs.readdirSync(imagesRoot);

			// remove files
			files.forEach(file => {
				fs.unlinkSync(`${imagesRoot}${file}`);
			});

			// write the svg to a file
			await fs.promises.writeFile(`${imagesRoot}${outputName}`, svg);

			// increment the image id
			imageId += 1;

			const content = new vscode.MarkdownString(`<img src="${outputName}" />`);
			content.isTrusted = true;
			content.supportHtml = true;
			content.baseUri = vscode.Uri.file(imagesRoot);

			return new vscode.Hover(content);			
		}});	  

		context.subscriptions.push(disposable);
	}

// This method is called when your extension is deactivated
export function deactivate() {}

