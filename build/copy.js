const cpy = require('cpy');
const progress = require('cli-progress');

function copy(src, dist, what) {
    return new Promise(resolve => {
        let started = false;
        const pb = new progress.Bar({}, progress.Presets.shades_classic);
        console.log(`Copying ${what}...`);
        cpy(src, dist, {recursive: true, parents: true}).on('progress', prg => {
            if (!started) {
                started = true;
                pb.start(prg.totalFiles, 0);
                return;
            }
            pb.update(prg.completedFiles);
        }).then(() => {
            pb.stop();
            console.log(`Copied ${what}.`);
            resolve();
        }, err => {
            console.log(`Error`, err.message);
        });
    });
}

module.exports = copy;
