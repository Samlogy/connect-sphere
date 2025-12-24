import { Application } from "express";
import { register as metricsRegister } from 'prom-client';
import config from "./config";


const metricsEndpoint = (app: Application) => {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', metricsRegister.contentType);
    res.send(await metricsRegister.metrics());
  });
}


export default {
  metrics: {
    metricsEndpoint
  }
}