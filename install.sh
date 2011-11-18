TOMCAT_APPS=/var/lib/tomcat6/webapps
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

sudo ln -s $DIR/Map/ $TOMCAT_APPS/Map
sudo ln -s $DIR/Proxy/ $TOMCAT_APPS/Proxy
sudo ln -s $DIR/RSS/ $TOMCAT_APPS/RSS
sudo ln -s $DIR/Search/ $TOMCAT_APPS/Search
sudo ln -s $DIR/Calendar/ $TOMCAT_APPS/Calendar
sudo ln -s $DIR/Dashboard/ $TOMCAT_APPS/Dashboard
