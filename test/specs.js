var test = require('tape'),
    almostEqual = require('almost-equal'),
    findstops = require('../.'),
    geojsonTrack = require('./sample-geojson.json');

test('does not accept empty input', function(t) {
    try {
        findstops();
        t.fail();
    } catch (e) {
        t.pass();
    }
    t.end();
});

test('does not accept non-LineString input', function(t) {
    try {
        findstops({type: 'Point'});
        t.fail();
    } catch (e) {
    }
    try {
        findstops({type: 'Feature'});
        t.fail();
    } catch (e) {
    }
    try {
        findstops({type: 'Feature', geometry: {type: 'Point'}});
        t.fail();
    } catch (e) {
    }
    t.end();
});

test('can find stops', function(t) {
    var stops = findstops(geojsonTrack).stops;

    t.equal(stops.features.length, 1);

    var stop = stops.features[0];
    t.ok(almostEqual(10.825, stop.geometry.coordinates[0], 5e-4), stop.geometry.coordinates[0]);
    t.ok(almostEqual(59.921, stop.geometry.coordinates[1], 5e-4), stop.geometry.coordinates[1]);

    t.end();
});

test('can ignore maxTimeGap', function(t) {
    var stops = findstops(geojsonTrack, {maxTimeGap: 24 * 60 * 60 * 1000}).stops;

    t.equal(stops.features.length, 4);

    var stop = stops.features[3];
    t.ok(almostEqual(10.825, stop.geometry.coordinates[0], 5e-4), stop.geometry.coordinates[0]);
    t.ok(almostEqual(59.921, stop.geometry.coordinates[1], 5e-4), stop.geometry.coordinates[1]);

    t.end();
});
