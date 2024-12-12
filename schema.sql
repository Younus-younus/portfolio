-- Portfolio Table
CREATE TABLE portfolio (
    id VARCHAR(250) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    describe_you VARCHAR(50),
    description VARCHAR(255) NOT NULL
);
-- Contact Table
CREATE TABLE contact (
    portfolio_id VARCHAR(250),
    -- Changed to match the VARCHAR type of portfolio.id
    gmail VARCHAR(100) NOT NULL,
    contact VARCHAR(15) NOT NULL,
    address VARCHAR(100) NOT NULL,
    PRIMARY KEY (portfolio_id, gmail),
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE
);
-- Education Table
CREATE TABLE education (
    portfolio_id VARCHAR(250),
    -- Changed to match the VARCHAR type of portfolio.id
    institute VARCHAR(100) NOT NULL,
    course VARCHAR(50) NOT NULL,
    PRIMARY KEY (portfolio_id, institute),
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE
);
-- Skill Table
CREATE TABLE skill (
    portfolio_id VARCHAR(250),
    -- Changed to match the VARCHAR type of portfolio.id
    skill1 VARCHAR(100) NOT NULL,
    skill2 VARCHAR(100),
    skill3 VARCHAR(100),
    allskill VARCHAR(100),
    PRIMARY KEY (portfolio_id, skill1),
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE
);
-- Interest Table
CREATE TABLE interest (
    portfolio_id VARCHAR(250),
    -- Changed to match the VARCHAR type of portfolio.id
    interest VARCHAR(150) NOT NULL,
    PRIMARY KEY (portfolio_id, interest),
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE
);
-- Languages Table
CREATE TABLE languages (
    portfolio_id VARCHAR(250),
    -- Changed to match the VARCHAR type of portfolio.id
    language VARCHAR(80) NOT NULL,
    PRIMARY KEY (portfolio_id, language),
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE
);
CREATE TABLE users (
    id varchar(200) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
CREATE TABLE likes (
    id varchar PRIMARY KEY,
    user_id VARCHAR(200) NOT NULL,
    portfolio_id VARCHAR(250) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE,
    UNIQUE (user_id, portfolio_id)
);

create table image (
    id varchar(255) PRIMARY KEY,
    user_id VARCHAR(200) NOT NULL,
    portfolio_id VARCHAR(250) NOT NULL,
    image_url VARCHAR(255) DEFAULT 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAV5KVoFMQYRrmaeJrVnTpV_dtjzlNBWkpqfKdeM12t4hu2sPoXKACj0VJjUr42ePTLpM&usqp=CAU',
    image_name varchar(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE,
    UNIQUE (user_id, portfolio_id)
)

