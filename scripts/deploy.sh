tar -czvf roam-todos.tar.gz .next public node_modules package.json next.config.js .env.production.local
scp roam-todos.tar.gz $DROPLET_USER@$DROPLET_IP:~/roam-todos.tar.gz
rm roam-todos.tar.gz
ssh $DROPLET_USER@$DROPLET_IP \
    "rm -rf code/roam-todos && mkdir code/roam-todos "\
    "tar -xzvf roam-todos.tar.gz -C code/roam-todos && "\
    "rm roam-todos.tar.gz && "\
    "cd code/roam-todos && "\
    "PATH=/home/$DROPLET_USER/.nvm/versions/node/v17.7.1/bin:$PATH && "\
    "pm2 delete roam-todos && "\ 
    'pm2 start "next start -p 3034" --name "roam-todos"'