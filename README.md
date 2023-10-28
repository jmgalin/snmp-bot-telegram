# snmp-bot

The SNMP Bot is a versatile Telegram manager designed to interact with Simple Network Management Protocol (SNMP) *snmpd* enabled devices. This bot facilitates the retrieval of essential device information, offering users quick access to crucial data points such as CPU usage, memory status, uptime, and more.

By seamlessly integrating with SNMP-enabled devices, users can harness the bot's capabilities to query known Object Identifiers (OIDs), fetch device data, monitor CPU performance, explore IP address tables, and even examine installed software. The bot provides a user-friendly interface for obtaining critical network-related insights and statistics.

This bot serves as an efficient tool for network administrators, IT professionals, and individuals interested in monitoring and managing network-connected devices, delivering valuable SNMP-based information through a familiar and accessible platform like Telegram.

Designed for simplicity and ease of use, the SNMP Bot empowers users to conveniently access and gather key metrics from their SNMP-supported devices, making it an invaluable companion for network management tasks.

You can perform the following actions by selecting the respective option:
- Consult known OID
- Retrieve device data
- Change contact person's name
- Check CPU status
- View IP address table
- Check device uptime
- View installed software
- Packet graphs on active interface

New features can be easily added.

## Installing

 - Install dependencies:
 
 `npm install net-snmp`

 - Configure BothFather Token in app.js:
 
 `var token = 'TOKEN_TELEGRAM';`

 - Run manager:
 
 `nodejs app.js`

 # Telegram Bot

 - Avaliable commands:

 --/help - Show this help message

 --/scan - Search for SNMP devices

 --/connect - Connection with SNMP device

 --/commands - Show command list

 
![Avaliable commands](/img/imginit.png)
![Options](/img/imgmenu.png)
![Usage_of_Alerts](/img/imgalert.png)