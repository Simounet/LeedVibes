'use strict';

import gulp from 'gulp';
import autoprefixer from 'gulp-autoprefixer';

import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';

const sass = gulpSass(dartSass);

gulp.task('css', () => {
    return gulp.src('./sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./css'));
});

gulp.task('css:watch', () => {
    gulp.watch('./sass/**/*.scss', ['sass']);
});
