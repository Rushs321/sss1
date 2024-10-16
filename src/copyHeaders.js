"use strict";

function copyHeaders(source, reply) {
  for (const [key, value] of Object.entries(source.headers)) {
    try {
      reply.header(key, value); // Use Fastify's reply.header method
    } catch (e) {
      console.log(e.message);
    }
  }
}

module.exports = copyHeaders;
