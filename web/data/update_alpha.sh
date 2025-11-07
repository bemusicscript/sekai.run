chown -R nobody:nogroup ./javascript_beta/.git
chown -R nobody:nogroup ./javascript_beta/*.js
cp javascript_beta/main.tmpl ./javascript_alpha/main.tmpl
cp javascript_beta/const.js ./javascript_alpha/const.js
cp javascript_beta/control.js ./javascript_alpha/control.js
cp javascript_beta/main.js ./javascript_alpha/main.js
chown -R nobody:nogroup ./javascript_alpha/*.js
