/*********************************
  Node Helper for MMM-OpenMeteoForecastDeluxe.

  This helper is responsible for pulling daily forecast data from the 
  Open-Meteo API, which provides a free, key-less endpoint.
*********************************/

var NodeHelper = require("node_helper");
var moment = require("moment");
// Note: Needle is imported but not used in this final fetch version.
var needle = require("needle"); 

module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node_helper for module [MMM-OpenMeteoForecastDeluxe]");
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "OPENMETEO_FORECAST_GET") {
            console.log("[MMM-OpenMeteoForecastDeluxe] " + notification );
            var self = this;

            if (payload.latitude == null || payload.longitude == null) {
                console.log("[MMM-OpenMeteoForecastDeluxe] ** ERROR ** Latitude or Longitude not provided.");
                return; // Stop execution if location is missing
            }

            // FIX: Construct the URL using a single backtick template literal
            var apiUrl = `https://api.open-meteo.com/v1/forecast?` +
                `latitude=${payload.latitude}` +
                `&longitude=${payload.longitude}` +
                // REQUEST CURRENT DATA 
                `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,winddirection_10m` +
                // REQUEST HOURLY DATA
                `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,windspeed_10m,winddirection_10m,windgusts_10m,weathercode` +
                // REQUEST DAILY DATA FOR FORECAST
                `&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,winddirection_10m_dominant,precipitation_probability_max,precipitation_sum,sunrise,sunset,time` +
                `&timeformat=unixtime` +
                `&timezone=auto` +
                `&forecast_days=${payload.maxDailies}`;

            console.log("[MMM-OpenMeteoForecastDeluxe] Getting data from: " + apiUrl);

            (async () => {
                try {
                    // Use a standard fetch request with a timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                    // The 'signal' property must be correctly accessed within the fetch call.
                    const resp = await fetch(apiUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (!resp.ok) {
                        throw new Error(`HTTP Error! Status: ${resp.status}`);
                    }

                    const json = await resp.json();

                    json.instanceId = payload.instanceId;

                    self.sendSocketNotification("OPENMETEO_FORECAST_DATA", json);
                    console.log("[MMM-OpenMeteoForecastDeluxe] Successfully retrieved and sent Open-Meteo data.");

                } catch (error) {
                    console.error("[MMM-OpenMeteoForecastDeluxe] ** ERROR ** Failed to fetch weather data: " + error.name + " - " + error.message);
                    self.sendSocketNotification("OPENMETEO_FETCH_ERROR", { instanceId: payload.instanceId, error: error.message });
                }
            })();
        }
    }
});
