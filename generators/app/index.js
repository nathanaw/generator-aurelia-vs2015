var fsExt = require('fs');
var path = require('path');
var os = require('os');
var yeoman = require('yeoman-generator');
var GitHubApi = require('github');
var rimraf = require('rimraf');

var Generator = module.exports = yeoman.generators.Base.extend({

		tempFolder : path.join(os.tmpdir().toString(), 'yeoman', 'dl', 'aurelia-skeleton-navigation'),
		vsVersion  : '2015',
		
		constructor : function () {
			yeoman.generators.Base.apply(this, arguments);
			this.option('skip-install');
		},

		init : function () {},

		prompting: function () {
			var done = this.async();
			this.prompt({
				type    : 'list',
				name    : 'vsVersion',
				message : 'What version of Visual Studio is installed and has the C++ components?',
				default : this.vsVersion,
				choices : ['2012', '2012e', '2013', '2013e', '2015', '2015e']
			}, function (answers) {
				this.vsVersion = answers.vsVersion;
				this.log('We\'ll use Visual Studio ' + this.vsVersion + ' during the npm install.');
				done();
			}.bind(this));
		},

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
						this._setKarmaPaths();
						this._bindGulpBuildEvents();
						
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

		
		/*
		Inject the following into the karma.conf.js file.
		Needed to allow Karma to locate files for "gulp test"
		
		proxies:  {
		  '/base/jspm_packages/': '/base/wwwroot/jspm_packages/'
		},		
		*/
		_setKarmaPaths: function () {
			var filePath = this.destinationPath('karma.conf.js')
			this.log('Reading file contents of ' + filePath);
			var fileContents = this.fs.read(filePath);
			this.log('Finished reading file contents. Updating file.');

			if (fileContents.indexOf('config.set({') <= -1) {
				this.env.error('Failed to locate the location to insert proxies into the karma.confg.js.');
				return;
			}
			
			// Adjust the output path.
			fileContents = fileContents.replace(
				'config.set({', 
				'config.set({\r\n\r\n    proxies:  {\r\n      \'/base/jspm_packages/\': \'/base/wwwroot/jspm_packages/\'\r\n    },'
			);

			// Update the file.
			this.log('Writing file contents of ' + filePath);
			this.fs.write(
				filePath,
				fileContents);
			this.log('Wrote file contents of ' + filePath);
		},

		_bindGulpBuildEvents : function () {
			var filePath = this.destinationPath('gulpfile.js')
			this.log('Reading file contents of ' + filePath);
			var fileContents = this.fs.read(filePath);
			this.log('Finished reading file contents. Updating file.');

			// Bind the build events. Add the VS comment to the gulpfile that hooks these events.
			fileContents = '/// <binding AfterBuild=\'build\' Clean=\'clean\' />\r\n' + fileContents;

			// Update the file.
			this.log('Writing file contents of ' + filePath);
			this.fs.write(
				filePath,
				fileContents);
			this.log('Wrote file contents of ' + filePath);
		},
		
		install : {
			runJSPM: function() {
				if (!this.options['skip-install']){
					this.log('Executing JSPM install');
					this.spawnCommand('jspm', ['install']);
				} else{
					this.log('JSPM install deliberately skipped');
				}
			},

			executeNPMInstall: function () {
				if (!this.options['skip-install']){
					this.log('Executing NPM install with VS ' + this.vsVersion);
					this.npmInstall(null, {msvs_version: this.vsVersion});
				} else {
					this.log('NPM install deliberately skipped');
				}
			}

		},

	});

Generator.name = "Generator Aurelia-VS2015";
