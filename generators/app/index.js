var fsExt = require('fs');
var path = require('path');
var os = require('os');
var yeoman = require('yeoman-generator');
var GitHubApi = require('github');
var rimraf = require('rimraf');

var Generator = module.exports = yeoman.generators.Base.extend({

		tempFolder : path.join(os.tmpdir().toString(), 'yeoman', 'dl', 'aurelia-skeleton-navigation'),

		constructor : function () {
			yeoman.generators.Base.apply(this, arguments);
			this.option('skip-install');
		},

		init : function () {},

		writing : function () {
			var done = this.async();

			var ghdownload = require('download-github-repo'),
			execFile = require('child_process').execFile;

			this.log(this.destinationRoot());
			this.log('Temp working folder: ' + this.tempFolder);
			this.log('Cleaning up temp files from ' + this.tempFolder);
			rimraf.sync(this.tempFolder);
			this.log('Finished cleaning up temp files from ' + this.tempFolder);

			var github = new GitHubApi({
					// required
					version : "3.0.0",
					debug : false,
					protocol : "https",
					host : "api.github.com",
					pathPrefix : "",
					timeout : 30000,
					headers : {
						"user-agent" : "Aurelia-Github-Loader"
					}
				});

			github.repos.getTags({
				user : 'aurelia',
				repo : 'skeleton-navigation',
				page : 1,
				per_page : 1
			}, function (err, result) {
				if (err !== undefined && err !== null) {
					this.env.error('Failed to get latest release info. Reason: ' + err.message);
					return;
				}

				if (result.length < 1) {
					this.env.error('No Release-Tags available');
					return;
				}
				console.log('Downloading latest available release: ' + result[0].name);

				// Kick off the repo download
				ghdownload("aurelia/skeleton-navigation#" + result[0].name, this.tempFolder, function (err) {
					if (err !== undefined && err !== null) {
						this.env.error(err);
					} else {
						this.log('Download complete');

						// this._setStylesPath_Temp();
						this._copySkeletonToFS();
						this._setJspmDirectory();
						this._setJspmConfigPath();
						this._setIndexHtmlPath();
						this._setStylesPath();
						this._setBuildPaths();
						this._setServePaths();
						
						done();
					}
				}.bind(this));
			}.bind(this));
		},

		_setStylesPath_Temp: function () {
			var filePathFrom = path.join(this.tempFolder, 'styles', 'styles.css');
			var filePathTo = path.join(this.tempFolder, 'wwwroot', 'styles', 'styles.css');
			fsExt.renameSync(filePathFrom, filePathTo);
			// this.fs.delete(this.destinationPath(path.join('styles', 'styles.css')));
		},
		
		_copySkeletonToFS : function () {
			// var dirls = fsExt.readdirSync(this.destinationRoot());
			var dirls = fsExt.readdirSync(this.tempFolder);
			this.log('Reading file list in ' + this.tempFolder);
			this.log(dirls);

			this.fs.copy(path.join(this.tempFolder, '**'), this.destinationRoot());

			this.log('Cleaning up temp files from ' + this.tempFolder);
			rimraf.sync(this.tempFolder);
			this.log('Finished cleaning up temp files from ' + this.tempFolder);
		},

		_setStylesPath: function () {
			var filePathFrom = this.destinationPath(path.join('styles', 'styles.css'));
			var filePathTo = this.destinationPath(path.join('wwwroot', 'styles', 'styles.css'));
			this.fs.move(filePathFrom, filePathTo);
			this.fs.delete(filePathFrom);
		},

		_setJspmDirectory : function () {
			// Read the package.json contents into a JSON object.
			this.log('Reading file contents of ' + this.destinationPath('package.json'));
			var jspm_config =
				JSON.parse(this.fs.read(
						this.destinationPath('package.json')));
			this.log('Finished reading file contents of package.json. Setting directories.');

			// Adjust the JSPM target directory.
			jspm_config.jspm.directories = {
				"baseURL" : "wwwroot"
			};

			// Update the file.
			this.log('Writing file contents of package.json.');
			this.fs.writeJSON(
				this.destinationPath('package.json'),
				jspm_config);
			this.log('Wrote file contents of package.json.');
		},

		_setJspmConfigPath: function () {
			var filePath = this.destinationPath(path.join('wwwroot', 'config.js'));
			this.fs.move(
					this.destinationPath('config.js'), 
					filePath
				);
		},

		_setIndexHtmlPath: function () {
			var filePath = this.destinationPath(path.join('wwwroot', 'index.html'));
			this.fs.move(
					this.destinationPath('index.html'), 
					filePath
				);

			filePath = this.destinationPath(path.join('wwwroot', 'index.js'));
			this.fs.move(
					this.destinationPath('index.js'), 
					filePath
				);
		},
		
		
		_setBuildPaths : function () {
			var filePath = this.destinationPath(path.join('build', 'paths.js'))
			this.log('Reading file contents of ' + filePath);
			var fileContents = this.fs.read(filePath);
			this.log('Finished reading file contents. Updating file.');

			if (fileContents.indexOf('var outputRoot = \'dist\/\';') <= -1) {
				this.env.error('Failed to locate the outputRoot in the build paths.');
				return;
			}
			
			// Adjust the output path.
			fileContents = fileContents.replace('var outputRoot = \'dist\/\';', 'var outputRoot = \'wwwroot\/dist\/\';');

			// Update the file.
			this.log('Writing file contents of ' + filePath);
			this.fs.write(
				filePath,
				fileContents);
			this.log('Wrote file contents of ' + filePath);
		},
		
		//baseDir: ['.']
		_setServePaths : function () {
			var filePath = this.destinationPath(path.join('build', 'tasks', 'serve.js'))
			this.log('Reading file contents of ' + filePath);
			var fileContents = this.fs.read(filePath);
			this.log('Finished reading file contents. Updating file.');

			if (fileContents.indexOf('baseDir: [\'.\']') <= -1) {
				this.env.error('Failed to locate the base directory in the serve paths.');
				return;
			}
			
			// Adjust the output path.
			fileContents = fileContents.replace('baseDir: [\'.\']', 'baseDir: [\'./wwwroot\']');

			// Update the file.
			this.log('Writing file contents of ' + filePath);
			this.fs.write(
				filePath,
				fileContents);
			this.log('Wrote file contents of ' + filePath);
		},
		

		install : function () {
			this._executeNPMInstall();
			this._runJSPM();
		},

		_executeNPMInstall: function () {
			if (!this.options['skip-install']){
				this.log('Executing NPM install');
				this.npmInstall();
			} else {
				this.log('NPM install deliberately skipped');
			}
		},

		_runJSPM: function() {
			if (!this.options['skip-install']){
				this.log('Executing JSPM install');
				this.spawnCommand('jspm', ['install']);
			} else{
				this.log('JSPM install deliberately skipped');
			}
		}

	});

Generator.name = "Generator Aurelia-VS2015";
