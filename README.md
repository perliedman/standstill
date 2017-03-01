# Standstill

[![Greenkeeper badge](https://badges.greenkeeper.io/perliedman/standstill.svg)](https://greenkeeper.io/)

Find locations where there has been no movement, a stop, within a [GeoJSON](http://geojson.org/) track, 
typically recorded from a GPS. Use this to analyze where a vehicle has stopped for a longer period, for example.

## Install & Setup

```sh
npm install --save standstill
``` 

## Usage

```javascript
var standstill = require('standstill'),
    stops = standstill(geojson).stops;
```

The `standstill` function, the single function exported by the module, takes a `LineString` feature as
argument. The feature must have a property called `coordTimes` which should contain dates or JavaScript
timestamps for each coordinate in the linestring.

The return value is an object with two properties: `stops`, a `FeatureCollection` of the analyzed stops from
the input linestring, and `routes`, a `FeatureCollection` of routes connecting the stops.

### Options

* _maxTimeGap_: maximum allowed time (in milliseconds) between two positions before considering the period
  between them as "no data", for example when the unit is turned off; default 300,000 (five minutes)
* _stopTolerance_: maximum allowed movement (positioning jitter) during a stop, in kilometers; default 0.1 km
* _stopMinTime_: minimum number of milliseconds to consider something a stop; default 300,000 (five minutes)
