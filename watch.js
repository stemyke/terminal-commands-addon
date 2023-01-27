const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const program = require('commander');
const watch = require('node-watch');
const copy = require('./build/copy');

program
    .version('1.0.0', '-v, --version')
    .option('-p, --project [path]', 'Project path where backend is used')
    .option('-b, --skip-build', 'Skip first build')
    .option('-m, --skip-modules', 'Skip copying node modules to project')
    .parse(process.argv);

const projectPath = typeof program.project !== 'string' ? null : path.resolve(program.project);
const noProject = !projectPath;

let builds = 0;

function deployToProject() {
    const modulePath = path.join(projectPath, 'node_modules', '@stemy');
    return copy('./dist/', modulePath, 'dist folder to project').then(() => {
        const targetPath = path.join(modulePath, 'terminal-commands-addon');
        if (fs.existsSync(targetPath)) {
            rimraf.sync(targetPath);
        }
        fs.renameSync(path.join(modulePath, 'dist'), targetPath);
    });
}

function build(type, cb = null) {
    if (!type && (noProject || program.skipBuild)) {
        cb();
        return;
    }
    console.log('Build started:', type || 'All');
    const child = spawn('node', ['build/build.js', type]);
    builds++;
    child.stdout.pipe(process.stdout);
    child.on('exit', () => {
        console.log('Build ended:', type || 'All');
        builds--;
        if (builds === 0) {
            console.log("All builds are finished");
            const deploy = noProject || !type ? Promise.resolve() : deployToProject();
            deploy.then(() => {
                if (typeof cb !== 'function') return;
                cb();
            });
        }
    });
}
build('', () => {
    console.log('Watching for file changes started.');
    watch('./src', { delay: 1000, recursive: true, filter: /\.(json|html|scss|ts)$/ }, () => build('backend'));
    if (noProject || program.skipModules) {
        deployToProject();
        return;
    }
    copy('./node_modules', path.join(projectPath, 'node_modules'), `node modules to project: ${projectPath}`).then(() => {
        deployToProject();
    });
});
