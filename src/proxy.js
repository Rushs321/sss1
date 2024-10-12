"use strict";
const axios = require("axios");
const pick = require("lodash").pick;
const shouldCompress = require("./shouldCompress");
const redirect = require("./redirect");
const compress = require("./compress");
const copyHeaders = require("./copyHeaders");

async function proxy(request, reply) {
  let url = request.query.url;
  if (Array.isArray(url)) url = url.join('&url=');
  if (!url) {
    reply.send('bandwidth-hero-proxy');
  }
  url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

  request.params.url = url;
  request.params.webp = !request.query.jpeg;
  request.params.grayscale = request.query.bw != 0;
  request.params.quality = parseInt(request.query.l, 10) || 40;

  /*// Redirect if the request is from the Bandwidth-Hero extension itself
  if (request.headers["via"] === "1.1 bandwidth-hero" && ["127.0.0.1", "::1"].includes(request.headers["x-forwarded-for"] || request.ip)) {
    return redirect(request, reply);
  }*/

  try {
        const response = await axios.get(request.params.url, {
            headers: {
        ...pick(request.headers, ["cookie", "dnt", "referer", "range"]),
        "user-agent": "Bandwidth-Hero Compressor",
        "x-forwarded-for": request.headers["x-forwarded-for"] || request.ip,
        via: "1.1 bandwidth-hero",
      },
            responseType: 'stream', // Handle response as a stream
            
            maxRedirects: 4, // Max redirects allowed
            
            
            
        });

        // Proceed only if status code is 200
        copyHeaders(response, reply);  // Copy headers from response to reply
        reply.header('content-encoding', 'identity');
        request.params.originType = response.headers['content-type'] || '';
        request.params.originSize = parseInt(response.headers['content-length'], 10) || 0;

        

        if (shouldCompress(request)) {
            return compress(request, reply, response.data);
        } else {
            return bypass(request, reply, response.data);
        }
    } catch (err) {
        return redirect(request, reply);
  }
}

module.exports = proxy;
