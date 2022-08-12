/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

const gulp = require('gulp');
const merge = require('gulp-merge-json');
const task = require('./lib/task');
const i18n = require('./lib/i18n');
const es = require('event-stream');
const vfs = require('vinyl-fs');
const minimist = require('minimist');
const { compileBuildTask } = require('./gulpfile.compile');
const { compileExtensionsBuildTask } = require('./gulpfile.extensions');
const { optimizeVSCodeTask } = require('./gulpfile.vscode');
const { optimizeVSCodeRehWebTask } = require('./gulpfile.reh');

const innoSetupConfig = {
	'zh-cn': { codePage: 'CP936', defaultInfo: { name: 'Simplified Chinese', id: '$0804', } },
	'zh-tw': { codePage: 'CP950', defaultInfo: { name: 'Traditional Chinese', id: '$0404' } },
	'ko': { codePage: 'CP949', defaultInfo: { name: 'Korean', id: '$0412' } },
	'ja': { codePage: 'CP932' },
	'de': { codePage: 'CP1252' },
	'fr': { codePage: 'CP1252' },
	'es': { codePage: 'CP1252' },
	'ru': { codePage: 'CP1251' },
	'it': { codePage: 'CP1252' },
	'pt-br': { codePage: 'CP1252' },
	'hu': { codePage: 'CP1250' },
	'tr': { codePage: 'CP1254' }
};

gulp.task(task.define(
	'vscode-translations-export',
	task.series(
		compileBuildTask,
		compileExtensionsBuildTask,
		optimizeVSCodeTask,
		optimizeVSCodeRehWebTask,
		function () {
			const pathToMetadata = './out-vscode/nls.metadata.json';
			const pathToRehWebMetadata = './out-vscode-reh-web/nls.metadata.json';
			const pathToExtensions = '.build/extensions/*';
			const pathToSetup = 'build/win32/i18n/messages.en.isl';

			return es.merge(
				gulp.src([pathToRehWebMetadata]).pipe(merge({
					fileName: 'nls.metadata.json',
					jsonSpace: '',
					concatArrays: true
				})).pipe(i18n.createXlfFilesForCoreBundle()),
				gulp.src(pathToSetup).pipe(i18n.createXlfFilesForIsl()),
				gulp.src(pathToExtensions).pipe(i18n.createXlfFilesForExtensions())
			).pipe(vfs.dest('../vscode-translations-export'));
		}
	)
));

gulp.task('vscode-translations-import', function () {
	const options = minimist(process.argv.slice(2), {
		string: 'location',
		default: {
			location: '../vscode-translations-import'
		}
	});
	return es.merge([...i18n.defaultLanguages, ...i18n.extraLanguages].map(language => {
		const id = language.id;
		return gulp.src(`${options.location}/${id}/vscode-setup/messages.xlf`)
			.pipe(i18n.prepareIslFiles(language, innoSetupConfig[language.id]))
			.pipe(vfs.dest(`./build/win32/i18n`));
	}));
});
