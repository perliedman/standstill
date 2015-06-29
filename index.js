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
            var c = result.stopCandidate;

            if (c) {
                if (result.lastTimestamp - c.startTime >= filter.stopMinTime) {
                    result.stops.features.push(point([c.lngSum / c.numCoords, c.latSum / c.numCoords], {
                        startTime: c.startTime,
                        endTime: result.lastTimestamp
                    }));
                    result.routes.features.push(linestring(result.currentRoute, {coordTimes: result.currentRouteTimes}));

                    return true;
                }
            }

            return false;
        },
        r = geojson.geometry.coordinates.reduce(function(result, c, i) {
            var t = geojson.properties.coordTimes[i],
                timestamp = new Date(t).getTime(),
                p = point(c),
                candidate = result.stopCandidate,
                d;

            if (result.lastPoint) {
                d = distance(p, result.lastPoint);
                if (d > filter.stopTolerance || timestamp - result.lastTimestamp > filter.maxTimeGap) {
                    handleCandidate(result);
                    delete result.stopCandidate;
                    if (result.candidateRouteCoords.length) {
                        result.currentRoute = result.currentRoute.concat(result.candidateRouteCoords);
                        result.currentRouteTimes = result.currentRouteTimes.concat(result.candidateRouteTimes);
                        result.candidateRouteCoords = [];
                        result.candidateRouteTimes = [];
                    }
                    result.candidateRouteCoords.push(c);
                    result.candidateRouteTimes.push(t);
                } else {
                    if (!candidate) {
                        candidate = result.stopCandidate = {
                            startTime: result.lastTimestamp,
                            lngSum: 0,
                            latSum: 0,
                            numCoords: 0
                        };
                    }

                    candidate.lngSum += c[0];
                    candidate.latSum += c[1];
                    candidate.numCoords++;
                    result.candidateRouteCoords.push(c);
                    result.candidateRouteTimes.push(t);
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
