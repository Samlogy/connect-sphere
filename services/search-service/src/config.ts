const env = process.env.NODE_ENV || 'local';
console.log('env => ', env)


const localConfig: any = {
    app: {
        port: parseInt(process.env.PORT || '4002'),
        node_env: process.env.NODE_ENV || 'local',
        app_name: process.env.APP_NAME || 'search-service',
        service_url: process.env.SERVICE_URL || 'http://localhost:4002',
        app_version: process.env.APP_VERSION || "1.0.0",
    },
    log: {
        logLevel: process.env.LOG_LEVEL || 'info',
        // log_to_stdout: process.env.LOG_TO_STDOUT || true,
        // redact_fields: process.env.REDACT_FIELDS || 'password,authorization,token',
        // env,
    },
    elastic: {
        ELASTIC_URL: process.env.ELASTIC_URL || 'http://localhost:9201'
    },
    broker: {
        RABBIT_URL: "amqp://rabbitmq:5672"
    },
    cache: {
        url: process.env.REDIS_URL || "redis://localhost:6380",
    },
};
const devConfig: any = {
    app: {
        port: parseInt(process.env.PORT || '4002'),
        node_env: process.env.NODE_ENV || 'dev',
        app_name: process.env.APP_NAME || 'search-service',
        service_url: process.env.SERVICE_URL || 'http://localhost:4002',
        app_version: process.env.APP_VERSION || "1.0.0",
    },
    log: {
        logLevel: process.env.LOG_LEVEL || 'info',
        // log_to_stdout: process.env.LOG_TO_STDOUT || true,
        // redact_fields: process.env.REDACT_FIELDS || 'password,authorization,token',
        // env,
    },
    elastic: {
        ELASTIC_URL: process.env.ELASTIC_URL || 'http://localhost:9200'
    },
    broker: {
        RABBIT_URL: "amqp://rabbitmq"
    },
    cache: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    }
};
const prodConfig: any = {
    app: {
        port: parseInt(process.env.PORT || '4002'),
        node_env: process.env.NODE_ENV || 'prod',
        app_name: process.env.APP_NAME || 'search-service',
        service_url: process.env.SERVICE_URL || 'http://localhost:4002',
        app_version: process.env.APP_VERSION || "1.0.0",
    },
    log: {
        logLevel: process.env.LOG_LEVEL || 'info',
        // log_to_stdout: process.env.LOG_TO_STDOUT || true,
        // redact_fields: process.env.REDACT_FIELDS || 'password,authorization,token',
        // env,
    },
    elastic: {
        ELASTIC_URL: process.env.ELASTIC_URL || 'http://localhost:9200'
    },
    broker: {
        RABBIT_URL: "amqp://rabbitmq"
    },
    cache: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    }
};

const envConfig = {
    local: localConfig,
    dev: devConfig,
    prod: prodConfig,
}[env];


export default { ...envConfig };
