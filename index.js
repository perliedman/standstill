var distance = require('turf-distance'),
    point = require('turf-point'),
    linestring = require('turf-linestring'),
    featurecollection = require('turf-featurecollection');

module.exports = function(geojson, options) {
    if (!geojson) {
        throw 'Must supply GeoJSON';
    }
    if (geojson.type !== 'Feature' || !geojson.geometry || geojson.geometry.type !== 'LineString') {
        throw 'GeoJSON must be a LineString feature';
    }

    options = options || {};
    var filter = {
            maxTimeGap: options.maxTimeGap || 5 * 60 * 1000,
            stopTolerance: options.stopTolerance || 0.1,
            stopMinTime: options.stopMinTime || 5 * 60 * 1000
        },
        handleCandidate = function(result) {
            var c = result.stopCandidate,
                coordSum;

            if (c) {
                delete result.stopCandidate;
                if (result.lastTimestamp - c.startTimeStamp >= filter.stopMinTime) {
                    coordSum = c.coords.reduce(function(center, c) {
                        center[0] += c[0];
                        center[1] += c[1];
                        return center;
                    }, [0, 0]);
                    result.stops.features.push(point([coordSum[0] / c.coords.length, coordSum[1] / c.coords.length], {
                        startTime: c.times[0],
                        endTime: c.times[c.times.length - 1]
                    }));
                    if (result.currentRoute.length > 0) {
                        result.currentRoute.push(c.coords[0]);
                        result.currentRouteTimes.push(c.times[0]);
                        result.routes.features.push(linestring(result.currentRoute, {coordTimes: result.currentRouteTimes}));
                    }
                    result.currentRoute = [];
                    result.currentRouteTimes = [];

                    return true;
                }

                result.currentRoute = result.currentRoute.concat(c.coords);
                result.currentRouteTimes = result.currentRouteTimes.concat(c.times);
            }

            return false;
        },
        r = geojson.geometry.coordinates.reduce(function(result, c, i) {
            var t = geojson.properties.coordTimes[i],
                timestamp = new Date(t).getTime(),
                p = point(c),
                candidate = result.stopCandidate,
                d;

            if (!candidate) {
                candidate = result.stopCandidate = {
                    startTimeStamp: timestamp,
                    coords: [],
                    times: []
                };
            }

            candidate.coords.push(c);
            candidate.times.push(t);

            if (result.lastPoint && candidate) {
                d = distance(p, result.lastPoint);
                if (d > filter.stopTolerance || timestamp - result.lastTimestamp > filter.maxTimeGap) {
                    handleCandidate(result);
                    result.currentRoute.push(c);
                    result.currentRouteTimes.push(t);
                }
            }

            result.lastPoint = p;
            result.lastTimestamp = timestamp;

            return result;
        }, {
            stops: featurecollection([]),
            routes: featurecollection([]),
            currentRoute: [],
            currentRouteTimes: [],
            candidateRouteCoords: [],
            candidateRouteTimes: []
        });

    handleCandidate(r);

    return {stops: r.stops, routes: r.routes};
};
