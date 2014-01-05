module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            // define the files to lint
            files: ['GruntFile.js', 'src/js/modula/*.js'],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                "undef": true,
                "unused": true,
                "eqeqeq": true,
                "immed": true,
                "latedef": true,
                "newcap": true,
                "noempty": true,
                "nonew": true,
                  // more options here if you want to override JSHint defaults
                globals: {
                    module: true,
                    console: true,
                    require: true,
                    exports: true,
                    window: true,
                    document: true,
                    Float32Array: true,
                }
            }
        },
        browserify: {
            dist: {
                files: {
                    'src/js/bin/bastos.js': ['src/js/bastos.js'],
                },
                options: {
                    debug: true,
                }
            }
        },
        watch: {
            scripts: {
                files: ['**/*.js'],
                tasks: ['browserify'],
                options: {
                    spawn: false,
                    debounceDelay: 250,
                }
            }
        },
        nodestatic: {
            server: {
                options: {
                    port: 8080,
                    base: 'src'
                }
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-nodestatic');

    grunt.registerTask('default', ['browserify','jshint','nodestatic','watch']);
};
