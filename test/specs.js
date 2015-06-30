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

test('routes have one timestamp per coordinate', function(t) {
    var routes = findstops(geojsonTrack, {maxTimeGap: 24 * 60 * 60 * 1000}).routes,
        r,
        i;

    t.ok(routes.features.length > 0, 'contains at least one route (' + routes.length + ')');

    for (i = 0; i < routes.features.length; i++) {
        r = routes.features[i];
        t.ok(r.geometry.coordinates.length, r.properties.coordTimes.length,
            'route ' + i + ' does not have one coordinate per timestamp');
    }

    t.end();
});

test('routes do not overlap', function(t) {
    var routes = findstops(geojsonTrack, {maxTimeGap: 24 * 60 * 60 * 1000}).routes,
        r1,
        r2,
        i;

    t.ok(routes.features.length > 1, 'contains at least two routes (' + routes.length + ')');

    for (i = 1; i < routes.features.length; i++) {
        r1 = routes.features[i - 1];
        r2 = routes.features[i];
        t.ok(r2.properties.coordTimes[0] > r1.properties.coordTimes[r1.properties.coordTimes.length - 1],
            'route ' + i + ' does not overlap route ' + (i - 1));
    }

    t.end();
});

test('routes and stops together are as long as original geojson', function(t) {
    var ts = function(d) { return new Date(d).getTime(); },
        d = findstops(geojsonTrack, {maxTimeGap: 24 * 60 * 60 * 1000}),
        indataTime = ts(geojsonTrack.properties.coordTimes[geojsonTrack.properties.coordTimes.length - 1]) -
            ts(geojsonTrack.properties.coordTimes[0]),
        stopTime = d.stops.features.reduce(function(t, s) {
            return t + ts(s.properties.endTime) - ts(s.properties.startTime);
        }, 0),
        routeTime = d.routes.features.reduce(function(t, r) {
            return t + ts(r.properties.coordTimes[r.properties.coordTimes.length - 1]) - ts(r.properties.coordTimes[0]);
        }, 0),
        aggregatedTime = stopTime + routeTime;

    t.ok(almostEqual(aggregatedTime, indataTime, 5 * 60 * 1000), aggregatedTime + ' should be similar to ' + indataTime +
        ' (diff is ' + Math.round((aggregatedTime - indataTime) / (60 * 1000)) + ' minutes)');
    t.end();
});
