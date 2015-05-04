#!/usr/bin/env bash

# install npm(nodejs package manager)
sudo apt-get -y install npm


# npm installs other dependencies mentioned in ./package.json 
sudo npm install


# cleaning up things
sudo pkill -9 -f chat_app
sudo pkill -9 -f firefox

# starting chat application
sudo ./back-end/app.js &

sleep 2

# testing
sudo firefox localhost:3700  




