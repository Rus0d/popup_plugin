var gulp = require('gulp'),
    notify = require('gulp-notify'),
    rename = require('gulp-rename'),
    browserSync = require('browser-sync');

gulp.task('default',['watch', 'browserSync']);

gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: ["./", "temp"],
            index: "index.html"
        },
        port: 8080,
        open: true,
        notify: false
    });
});

gulp.task('html', function () {
    gulp.src('temp/index.html')
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('watch', function () {
    gulp.watch(['plugin/popup_plugin.js'], ['html']);
});
