const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const debug = require('debug');
const log = debug('templating');
const verbose = debug('verbose');

const baseDir = __dirname;
const tmplDir = path.join(baseDir, argv.templates || './templates');
const includeDir = path.join(baseDir, argv.content || './content');
const includePattern = /\{\{\{([^\}]+)}\}\}/;

readTemplates(tmplDir, processFiles);

function readTemplates(dir, done){
  log(`reading ${dir}`);
  fs.readdir(dir, done);
}

function processFiles(error, templates){
  log(templates);
  templates.map(inlineIncludes);
}

function inlineIncludes(htmlFileName){
  fs.readFile(path.join(tmplDir, htmlFileName), 'utf-8', function(e, html){
    const match = includePattern.exec(html)
    const inlineFileName = match[1];
    const replaceString = match[0];
    
    log(`reading: ${path.join(includeDir, inlineFileName)}`)
    fs.readFile(path.join(includeDir, inlineFileName), 'utf-8', function(err, markdown){
      const templated = html.replace(replaceString, markdown);
      verbose(templated);
      const outpath = path.join(baseDir, htmlFileName)

      log(`writing ${outpath}...`)
      fs.writeFile(outpath, templated, function writeCompleted(e){
        if(e){console.error(e);}
        else{ log(`wrote ${outpath}`); }
      });
    });

  });
}