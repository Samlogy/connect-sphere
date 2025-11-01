import dotenv from 'dotenv';
dotenv.config();

const env = process.env.NODE_ENV || 'local';


const localConfig = {
    app: {
        port: parseInt(process.env.PORT || '4001'),
        node_env: process.env.NODE_ENV || 'local',
    },
    auth: {
        jwt_secret: process.env.JWT_SECRET || "supersecret"
    },
    db: {
        user: process.env.PG_USER || "",
        host: process.env.PG_HOST || "",
        database: process.env.PG_DATABASE || "",
        password: process.env.PG_PASSWORD || "",
        port: process.env.PG_PORT,
    },
    cache: {
        url: process.env.REDIS_URL || '',
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
const devConfig = {
    app: {
        port: parseInt(process.env.PORT || '4001'),
        node_env: process.env.NODE_ENV || 'dev',
    },
    auth: {
        jwt_secret: process.env.JWT_SECRET || "supersecret"
    },
    db: {
        user: process.env.PG_USER || "",
        host: process.env.PG_HOST || "",
        database: process.env.PG_DATABASE || "",
        password: process.env.PG_PASSWORD || "",
        port: process.env.PG_PORT,
    },
    cache: {
        url: process.env.REDIS_URL || '',
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
const prodConfig = {
    app: {
        port: parseInt(process.env.PORT || '4001'),
        node_env: process.env.NODE_ENV || 'prod',
    },
    auth: {
        jwt_secret: process.env.JWT_SECRET || "supersecret"
    },
    db: {
        user: process.env.PG_USER || "",
        host: process.env.PG_HOST || "",
        database: process.env.PG_DATABASE || "",
        password: process.env.PG_PASSWORD || "",
        port: process.env.PG_PORT,
    },
    cache: {
        url: process.env.REDIS_URL || '',
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

const envConfig = {
    local: localConfig,
    dev: devConfig,
    prod: prodConfig,
}[env];


export default { ...envConfig };
