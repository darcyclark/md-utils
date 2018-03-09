var Finder = require('fs-finder')
    , fs = require('fs')
    , path = require('path')
    , yaml = require('front-matter')
    , util = require('util')
    , jade = require('jade')
    , _ = require('underscore')
_.str = require('underscore.string')

module.exports.getFiles = getFiles
module.exports.getFolders = getFolders
module.exports.getPage = getPage
module.exports.getPages = getPages

function getFiles(dir, filter) {

    var result = []
        , files = Finder.in(dir).findFiles(filter)

    files.forEach(function (image) {
        var stats = fs.statSync(image)
        var date = new Date(util.inspect(stats.mtime))
        var name = path.basename(image)
        result.push({ name: name, date: date })
    });

    return result
};

function getFolders(dir) {

    Array.prototype.move = function (from, to) {
        this.splice(to, 0, this.splice(from, 1)[0]);
    };

    var result = []
        , folders = Finder.in(dir).findDirectories()

    // try to find order.txt in pages directory
    try {
        data = fs.readFileSync(dir + 'order.txt')
        var order = data.toString().split("\n")
        order.pop()
    } catch (e) {
        console.log("order.txt not found")
        var order = []
    }

    folders.forEach(function (folder) {
        foldername = path.basename(folder)
        result.push(foldername)
    })

    // reorder folders based on order
    order.reverse().forEach(function (o) {
        result.move(result.indexOf(o), 0)
    })

    return result
};

function getPage(page) {
    var html = ''
    p = path.join(path.dirname(require.main.filename), '/views/', page + '.jade')
    if (fs.existsSync(p)) {
        html = jade.renderFile(p)
    }
    return html
};

function getPages(dir, extension, recursive) {

    //console.log("indexing: " + dir);
    var ext = (typeof extension === "undefined") ? '*.md' : extension
        , files = (typeof recursive === "undefined") ? Finder.in(dir).findFiles(ext) : Finder.from(dir).findFiles(ext)
        , result = []

    files.forEach(function (file) {
        // strip off path and .extension
        var filename = path.basename(file, '.md')

        if (!(_.contains(['_layout', '_template', '_navbar', '_footer', '_menu'], filename))) {
            var chunks = file.split(path.sep)
                , folder = chunks[chunks.length - 2]
                , out = yaml(fs.readFileSync(file, 'utf-8')) // read file and parse yaml
            // augment and flatten metadata
            if (_.isUndefined(out.attributes.publish)) {
                out.attributes.publish = true // publish by default
            };
            out.attributes.file = file
            out.attributes.filename = filename
            out.attributes.folder = (folder === 'pages') ? null : folder
            out.attributes.content = out.body

            result.push(out.attributes)
        }
    });
    published = _.filter(result, function (page) { return page.publish; })
    sorted = _.sortBy(published, "order")
    return sorted
};
