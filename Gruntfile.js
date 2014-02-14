module.exports = function(grunt) {
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  var projectConfig = {
    app: 'app/',
    dist: 'dist/'
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    aws: grunt.file.readJSON('aws-keys.json'),
    project: projectConfig,
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= project.dist %>'
          ]
        }]
      },
      server: {
        files: [{
          src: [
            '.tmp'
          ]
        }]
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: './<%= project.app %>',
          dest: '<%= project.dist %>',
          src: [ '**' ]
        }]
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.app %>public/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= project.dist %>public/images'
        }]
      }
    },
    aws_s3: {
      options: {
        accessKeyId: '<%= aws.AWSAccessKeyId %>',
        secretAccessKey: '<%= aws.AWSSecretKey %>'
      },
      dist: {
        options: {
          differential: false,
          bucket: 'cftipjar',
          access: 'public-read',
          uploadConcurrency: 5
        },
        params: {
          "CacheControl": "630720000",
          "Expires": new Date(Date.now() + 63072000000).toUTCString(),
          "ContentEncoding": "gzip"
        },
        files: [
          {
            expand: true,
            cwd: '<%= project.dist %>public/',
            src: [ '**' ],
            dest: 'dist/public/',
            action: 'upload'
          }
        ]
      }
    },
    usebanner: {
      dist: {
        options: {
          position: 'top',
          banner: '/*\n DwollaLabs <%= pkg.name %> v<%= pkg.version %>\n*/',
          linebreak: true
        },
        files: {
          src: [
            '<%= project.dist %>public/javascripts/*.js',
            '<%= project.dist %>public/css/*.css'
          ]
        }
      }
    },
    bump: {
      options: {
        files: [ 'cloudflare.json', 'package.json' ],
        commitMessage: 'Release v%VERSION%',
        commitFiles: [ 'cloudflare.json', 'package.json' ],
        createTag: false,
        push: false,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        updateConfigs: [ 'pkg' ]
      }
    },
    'string-replace': {
      dist: {
        options: {
          replacements: [
            {
              pattern: 'http://mike.dev/public/',
              replacement: 'https://cftipjar.s3.amazonaws.com/dist/public/',
            },
            {
              pattern: '//VERSION//',
              replacement: '<%= pkg.version %>'
            }
          ]
        },
        files: [{
          src: '<%= project.dist %>public/javascripts/tipjar.js',
          dest: '<%= project.dist %>public/javascripts/tipjar.js',
        }]
      }
    }
  });

  grunt.registerTask('build', [
    'clean:dist',
    'copy',
    'imagemin',
    'usebanner',
    'string-replace',
    'aws_s3',
    'clean:server',
    'bump'
  ]);

  grunt.registerTask('default', ['build']);
};
