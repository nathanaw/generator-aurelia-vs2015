# generator-aurelia-vs2015

###Aurelia + ASP.NET 5 + Visual Studio 2015###

A [Yeoman](http://yeoman.io) generator  
... for adding the [Aurelia](http://aurelia.io) skeleton  
... to a Visual Studio 2015 [ASP.NET 5 project](http://www.asp.net/vnext).

This generator pulls the standard skeleton from the Aurelia repo and tweaks a couple paths to work inside the new asp.net 5 project structure.

The generator is known to work with the Aurelia skeleton [v0.18.x](https://github.com/aurelia/skeleton-navigation/tree/0.18.1).

## Getting Started

####Install generator-aurelia-vs2015 from npm:

1. Install pre-requisites below. See [the aurelia getting started guide](http://aurelia.io/get-started.html) for details.
2. Run **`npm install -g generator-aurelia-vs2015`**

####To initiate the generator

1. Create a new ASP.NET 5 site in Visual Studio
  - Empty, Web API, or Web Application.
2. Change to the project's root directory
  - This should be a directory under the solution root, inside the "src" folder.
  - Example,  
... for a solution name "MySolution"  
... created at c:\temp,  
... with a project name of "MyApp",  
... the project's root directory would be at `c:\temp\MySolution\src\MyApp`.
3. Run **`yo aurelia-vs2015`**
  - Select which version of Visual Studio has a C++ compiler installed.
  - Wait for generator to finish.
6. Gulp watch.
7. Open http://localhost:9000/ in your browser to see the site.


## Pre-Requisites

- **[node.js & npm](https://nodejs.org)**
  - Tested with [node v0.12.7](https://nodejs.org/dist/v0.12.7/)
  - Seems to be some issues with node 4.x
- **[Yeoman](http://yeoman.io/)**
  - **`npm install -g yeoman`**
- **[gulp](http://gulpjs.com/)**
  - **`npm install -g gulp`**
- **[jspm - JavaScript Package Manager](http://jspm.io/)**
  - **`npm install -g jspm`**
  - Configure jspm to use your github account to work around rate limits. `jspm registry config github`

## Suggested Pre-Requisites

*The project will mostly work without building socket.io, but the `npm install` phase of the generator may show errors.* 

- **[node-gyp](https://www.npmjs.com/package/node-gyp)** 
  - **`npm install -g node-gyp`**
  - Needed to build socket.io.
- **[Python v2.x](https://www.python.org/)** 
  - Needed for node-gyp to build socket.io.
  - Tested with [Python 2.7.10](https://www.python.org/downloads/release/python-2710/). 
  - *3.X does not work at this time.*
- **Visual Studio C++ compiler**
  - Some version of VS with the C++ compiler. Needed for node-gyp to build socket.io.
  - Express editions should work too.


## License

MIT

