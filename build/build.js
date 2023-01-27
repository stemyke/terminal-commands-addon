const ngPackage = require('ng-packagr');
const path = require('path');
const process = require('process');
const copy = require('./copy');

const buildType = process.argv[2];
const buildCallbacks = [
    {
        type: 'backend',
        cb: () => {
            ngPackage
                .ngPackagr()
                .withTsConfig('tsconfig.json')
                .forProject('ng-package.json')
                .build()
                .catch(error => {
                    console.error(error);
                    process.exit(1);
                });
        }
    }
];

if (!buildType) {
    buildCallbacks.forEach(t => t.cb());
} else {
    const build = buildCallbacks.find(t => t.type === buildType);
    if (!build) {
        console.log('Nothing to build because of wrong build type: ', buildType);
    } else {
        build.cb();
    }
}
