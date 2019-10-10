/**
 * Possibly Unused i18n Token Finder
 * Key word: POSSIBLY
 *
 * Looks for i18n tokens that MAY be unused by the code
 * Since some tokens are generated dynamically, the list generated by this script
 * should ALWAYS be verified manually before removing any of the tokens in it
 *
 * Ghostery Browser Extension
 * http://www.ghostery.com/
 *
 * Copyright 2019 Ghostery, Inc. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0
 */

console.time('unused-i18n-token-finder');

// eslint-disable-next-line import/no-extraneous-dependencies
const fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const jsonfile = require('jsonfile');

// Constants
const DEFAULT_LOCALE_TOKENS_FILE = './_locales/en/messages.json';
const UNUSED_TOKENS_DIR = './tools/i18n_results';
const UNUSED_TOKENS_FILENAME = 'unused_tokens.txt';

function saveListOfUnusedTokensToFile(unusedTokens) {
	const filepath = `${UNUSED_TOKENS_DIR}/${UNUSED_TOKENS_FILENAME}`;

	if (!fs.existsSync(UNUSED_TOKENS_DIR)) {
		fs.mkdirSync(UNUSED_TOKENS_DIR);
	}

	fs.writeFileSync(
		filepath,
		unusedTokens.join('\n')
	);
}

function findUnusedTokens(tokens, filepaths) {
	tokens = tokens.map(token => ({ value: token, isUsed: false }));

	filepaths.forEach((filepath) => {
		const fileContents = fs.readFileSync(filepath, 'utf8');
		tokens.forEach((token) => {
			if (token.isUsed) { return; }

			// THE TEST
			if (fileContents.includes(`t('${token.value}`)) {
				token.isUsed = true;
			}
		});
	});

	const unusedTokens =
		(tokens.filter(token => token.isUsed === false))
			.map(token => token.value);

	return unusedTokens;
}

/**
 * Recursively collect the filepaths of files that
 * satisfy the supplied extension and file system location conditions
 * @param [Array|object] whereToLookAndForWhatExtensions
 * @param [string Array] filepaths							The matching filepaths
 * @returns [string Array] filepaths						The matching filepaths
 */
function getFilepaths(whereToLookAndForWhatExtensions, filepaths = []) {
	const target = whereToLookAndForWhatExtensions;

	if (Array.isArray(target)) {
		target.forEach((t) => {
			filepaths = getFilepaths(t, filepaths);
		});
	} else {
		const dirEntries = fs.readdirSync(target.dir, { withFileTypes: true });

		dirEntries.forEach((dirEntry) => {
			if (dirEntry.isDirectory()) {
				filepaths = getFilepaths({
					dir: `${target.dir}/${dirEntry.name}`,
					extensions: target.extensions
				}, filepaths);
			} else if (dirEntry.isFile()) {
				if (target.extensions.some(extension => dirEntry.name.endsWith(extension))) {
					filepaths.push(`${target.dir}/${dirEntry.name}`);
				}
			}
		});
	}

	return filepaths;
}

function getJSONKeys(filepath) {
	const json = jsonfile.readFileSync(filepath);
	return Object.keys(json);
}

saveListOfUnusedTokensToFile(
	findUnusedTokens(
		getJSONKeys(DEFAULT_LOCALE_TOKENS_FILE),
		getFilepaths(
			[
				// Overly broad, but we favor simplicity since there is no compelling reason here to favor performance / efficiency
				// Also, we prefer that unused tokens be incorrectly reported as used than vice versa
				{ dir: './app', extensions: ['.jsx', '.js'] },
				{ dir: './src', extensions: ['.js'] },
			]
		)
	)
);

console.log('\nPLEASE NOTE:');
console.log('Since some i18n tokens are generated dynamically,')
console.log('and since some others are formatted in a non-standard way,');
console.log('the list generated by this script should ALWAYS');
console.log('be verified manually before removing any of the tokens in it.');
console.log('\nThe results are in ./tools/i18n_results/unused_tokens.txt\n');

console.timeEnd('unused-i18n-token-finder');
