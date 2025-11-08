import dotenv from 'dotenv';
// dotenv.config();

const env = process.env.NODE_ENV || 'dev';


const localConfig: any = {
    app: {
        port: parseInt(process.env.PORT || '4001'),
        node_env: process.env.NODE_ENV || 'local',
        app_name: process.env.APP_NAME || 'user-service',
        service_url: process.env.SERVICE_URL || 'http://localhost:4001',
        app_version: process.env.APP_VERSION || "1.0.0",
    },
    auth: {
        jwt_secret: process.env.JWT_SECRET || "supersecret"
    },
    db: {
        user: process.env.PG_USER || "postgres",
        host: process.env.PG_HOST || "localhost",
        database: process.env.PG_DATABASE || "usersdb",
        password: process.env.PG_PASSWORD || "postgres",
        port: process.env.PG_PORT || 5433,
    },
    cache: {
        url: process.env.REDIS_URL || "redis://localhost:6380",
    },
    log: {
        logLevel: process.env.LOG_LEVEL || 'info',
        log_to_stdout: process.env.LOG_TO_STDOUT || true,
        redact_fields: process.env.REDACT_FIELDS || 'password,authorization,token',
        env,
    },
    elk: {
        enabled: false,
        host: 'http://localhost:9200',
    },
};
const devConfig: any = {
    app: {
        port: parseInt(process.env.PORT || '4001'),
        node_env: process.env.NODE_ENV || 'dev',
        app_name: process.env.APP_NAME || 'user-service',
        service_url: process.env.SERVICE_URL || 'http://localhost:4001',
        app_version: process.env.APP_VERSION || "1.0.0",
    },
    auth: {
        jwt_secret: process.env.JWT_SECRET || "supersecret"
    },
    db: {
        user: process.env.PG_USER || "postgres",
        host: process.env.PG_HOST || "user-service-db",
        database: process.env.PG_DATABASE || "usersdb",
        password: process.env.PG_PASSWORD || "postgres",
        port: process.env.PG_PORT || 5432,
    },
    cache: {
        url: process.env.REDIS_URL || "redis://user-service-cache:6379",
    },
    log: {
        logLevel: process.env.LOG_LEVEL || 'info',
        log_to_stdout: process.env.LOG_TO_STDOUT || true,
        redact_fields: process.env.REDACT_FIELDS || 'password,authorization,token',
        env,
    },
    elk: {
        enabled: false,
        host: 'http://elasticsearch:9200',
    },
};
const prodConfig: any = {
    app: {
        port: parseInt(process.env.PORT || '4001'),
        node_env: process.env.NODE_ENV || 'prod',
        app_name: process.env.APP_NAME || 'user-service',
        service_url: process.env.SERVICE_URL || 'http://localhost:4001',
        app_version: process.env.APP_VERSION || "1.0.0",
    },
    auth: {
        jwt_secret: process.env.JWT_SECRET || "supersecret"
    },
    db: {
        user: process.env.PG_USER || "postgres",
        host: process.env.PG_HOST || "user-service-db",
        database: process.env.PG_DATABASE || "usersdb",
        password: process.env.PG_PASSWORD || "postgres",
        port: process.env.PG_PORT || 5432,
    },
    cache: {
        url: process.env.REDIS_URL || "redis://user-service-cache:6379",
    },
    log: {
        logLevel: process.env.LOG_LEVEL || 'info',
        log_to_stdout: process.env.LOG_TO_STDOUT || true,
        redact_fields: process.env.REDACT_FIELDS || 'password,authorization,token',
        env,
    },
    elk: {
        enabled: false,
        host: 'http://elasticsearch:9200',
    },
};

const envConfig = {
    local: localConfig,
    dev: devConfig,
    prod: prodConfig,
}[env];


export default { ...envConfig };
