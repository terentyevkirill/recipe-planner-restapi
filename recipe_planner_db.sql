create table preferences
(
    category   varchar(150) not null,
    preference varchar(150) not null,
    primary key (category, preference)
);

create table user_account
(
    userId   int auto_increment
        primary key,
    username varchar(100) not null,
    password varchar(200) not null,
    constraint U
        unique (username)
);

create table user_preferences
(
    userId     int          not null,
    category   varchar(150) not null,
    preference varchar(150) not null,
    constraint userId
        unique (userId, category, preference),
    constraint user_preferences_ibfk_1
        foreign key (category, preference) references preferences (category, preference),
    constraint user_preferences_user_account_userId_fk
        foreign key (userId) references user_account (userId)
            on update cascade on delete cascade
);

create index category
    on user_preferences (category, preference);

create table user_recipe_calendar
(
    id            int auto_increment
        primary key,
    recipeId      int  not null,
    userId        int  not null,
    calendar_date date not null,
    constraint AK_user_recipe_calendar
        unique (recipeId, userId, calendar_date),
    constraint FK_user_recipe_calendar_user_account
        foreign key (userId) references user_account (userId)
            on update cascade on delete cascade
);

create index IXFK_user_recipe_calendar_user_account
    on user_recipe_calendar (userId);

create table user_recipe_store
(
    id       int auto_increment
        primary key,
    recipeId int not null,
    userId   int not null,
    constraint AK_user_recipe_store
        unique (recipeId, userId),
    constraint FK_user_recipe_store_user_account
        foreign key (userId) references user_account (userId)
            on update cascade on delete cascade
);

create index IXFK_user_recipe_store_user_account
    on user_recipe_store (userId);

insert into user_account (username, password) values ('admin', 'qwerty1234');
