var snmp = require ("net-snmp");
var TelegramBot = require('node-telegram-bot-api');
const { createCanvas } = require('canvas');
const Chart = require('chart.js/auto');
const fs = require('fs');
const { count } = require("console");


// Token dado por Telegram
var token = '[Token_telegram]';


// Creamos la instancia de Telegram
var bot = new TelegramBot(token, { polling: true });

/**
* Comando /start
* Para mostrar el nombre del usuario
**/
bot.onText(/\/start/, function (msg, match) {
  var chatId = msg.chat.id;
  var firstName = msg.chat.first_name;

  var resp = `*Bienvenido, ${firstName}*.\nEscribe /help para mostrar los comandos disponibles.`;

  bot.sendMessage(chatId, resp, {parse_mode: "Markdown"});
});

/**
* Command /help
* Show the list of commands available to the bot
**/
bot.onText(/\/help/, function (msg, match) {
    var chatId = msg.chat.id;

    var resp = "Comandos disponibles:\n";
    resp += "/help - Mostrar este mensaje de ayuda\n";
    resp += "/scan - Busqueda dispositivos SNMP\n";
    resp += "/connect - Conexion con dispositivo SNMP\n";
    resp += '/commands - Mostrar lista de comandos\n';

    // Mandamos el mensaje anterior al chat de Telegram
    bot.sendMessage(chatId, resp);
});

// Escuchamos una peticion desde el chat
bot.on('message', function (msg) {

    switch (getCommand()) {
        case 'scan':
            //Ver si comentado o no
            commandSession(chatId, msg.text);
            setCommand();
        case 'connect':
            commandSession(chatId, msg.text);
            setCommand();
        break;
            default:
            break;
    }

});


/**
* Establecer Sesion SNMP 
**/
var setSession = function(session)
{
    this.session = session;
};

/**
* Obtener sesion SNMP
**/
var getSession = function() {
    return this.session;
};

/**
* Establecer un comando
**/
var setCommand = function(command) {
    this.command = command;
};

/**
* Obtener un comando
**/
var getCommand = function() {
    return this.command;
}

/**
* Establecer identificador del chat
**/
function setChatId(chatId) {
    this.chatId = chatId;
}

/**
* Obtener identificador del chat
**/
function getChatId()
{
    return this.chatId;
}

/**
* Botones del menú principal
**/
function loadButtons() {
    var options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: 'Consultar OID conocida', callback_data: 'getconsulta' }],
                [{ text: 'Datos del equipo', callback_data: 'getdata' }],
                [{ text: 'Cambiar nombre persona contacto', callback_data: 'setsyscontact' }],
                [{ text: 'CPU', callback_data: 'cpu' }],
                [{ text: 'Tabla direcciones IP', callback_data: 'tablaip' }],
                [{ text: 'Tiempo encendido', callback_data: 'uptime' }],
                [{ text: 'Software Instalado', callback_data: 'swinstalled' }],
                [{ text: 'Graficas de paquetes en interfaz activa', callback_data: 'numoctetos' }]
            ]
        })
    };
    bot.sendMessage(getChatId(), 'Seleciona la opción que desee mostrar:', options).then(function (sended) {

    });
}

/**
* Mostramos el mensaje formado anteriormente cuando recibimos /commands
**/
bot.onText(/\/commands/, function (msg, match) {
    loadButtons();
});

/**
* Cuando recibimos un callback a cualquier botón, es decir, cuando es pulsado
**/
let alarmaActivada = false;
let intervalId;
bot.on('callback_query', function (msg) {
    setChatId(msg.message.chat.id);
    setCommand(msg.data);
    //bot.sendMessage(getChatId(), 'Procesando, espere...').then(function (sended) {
        switch (msg.data) {
            case 'getconsulta':
                bot.sendMessage(chatId, 'Por favor, escribe el OID o nombre de la variable que desea consultar:');
                bot.once('message', (msg) => {
                const parametro = msg.text.toString();
                const resultado = buscarParametro(parametro);
                if (resultado) {
                  const nombreVariable = resultado.nombreVariable;
                  const oid = resultado.oid;
              
                  getConsulta(nombreVariable, [oid]);
                } else {
                  const oid = msg.text.toString();
                  getConsulta2([oid]);
                }
                //getConsulta([oid]);
                setCommand();
                 });
                
                setCommand();
                break;
            case 'getdata':
                getData();
                setCommand();
                break;
            case 'setsyscontact':
         
                bot.sendMessage(chatId, 'Por favor, escribe el nuevo nombre de contacto:');
                bot.once('message', (msg) => {
                const parametro = msg.text;
                setsyscontact(parametro);
                setCommand();
                });
            
                break;
            case 'cpu':
                cpu();
                setCommand();
                break;
            case 'tablaip':
                tablaip();
                setCommand();
                break;
            case 'uptime':
                uptime();
                setCommand();
                break;
            case 'swinstalled':
                SWInstalled();
                setCommand();
                break;
            case 'numoctetos':
                bot.sendMessage(chatId, 'Se va a monitorizar el trafico de paquetes entrantes y salientes durante 2 min:');
                numOctetos();
                setCommand();
                break;
            default:
            break;
        }
    //});
});

/**
* GetConsulta info que hace una consulta a una OID dada como parametro
**/
function getConsulta(nombreVariable, oid) {
  console.log('funcion getConsulta');
  getOid(oid, function(data) {  
      bot.sendMessage(getChatId(),nombreVariable+": "+ data);
  });
}

function getConsulta2(oid) {
  console.log('funcion getConsulta2');
  getOid(oid, function(data) {  
      bot.sendMessage(getChatId(),data);
  });
}

function buscarParametro(parametro) {
  // Lee el archivo que contiene los pares nombrevariable|oid
  const archivo = fs.readFileSync('./node_modules/net-snmp/varrfc1213.txt', 'utf-8');

  // Divide el contenido del archivo en líneas
  const lineas = archivo.split('\n');

  // Busca el parámetro en cada línea del archivo
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();

    // Divide la línea en nombrevariable y oid usando el delimitador "|"
    const partes = linea.split('|');
    const nombreVariable = partes[0];
    const oid = partes[1];

    // Compara el parámetro con el nombre de la variable
    if (nombreVariable === parametro || oid === parametro) {
      return { nombreVariable, oid };
    }
  }

  // Si no se encuentra el parámetro, devuelve null
  return null;
}

/**
* Get tablaip info
**/
function getData() {
    console.log('obteniendo datos del equipo');
    var msg = "*Datos del equipo:*\n\n";
    var i = 0;
    var desc = ['Persona contacto: ',
                'Nombre equipo: ',
                'Localizacion: '];


    getOid(['1.3.6.1.2.1.1.4.0', '1.3.6.1.2.1.1.5.0', '1.3.6.1.2.1.1.6.0'], function(data) {
        

        msg += desc[i]+(data)+" \n";
        if( i == desc.length - 1 )
        {
            bot.sendMessage(getChatId(), msg, {parse_mode: "Markdown"});
        }
        i = i+1;


    });
}

/**
* Set syscontact
**/
function setsyscontact(valor) {
  console.log('set syscontact');
  var msg = "*Nuevo nombre de contacto:*";
  var oid = "1.3.6.1.2.1.1.4.0";
  setOid(oid, valor, function(data) {        
          bot.sendMessage(getChatId(),msg +" "+valor+"\n", {parse_mode: "Markdown"});                
  });

}

/**
* Get CPU info
**/

function cpu() {
  console.log('CPU load');
  var msg = "*Tabla de porcentaje de procesador:*\n\n";
  var i = 0;
  var desc = [];
              
  var oid = ['1.3.6.1.2.1.25.3.3.1.2'];
  var nonRepeaters = 0;
  var maxRepetitions = 0;
  var valormedio = 0;

  //Miramos los core que tenemos
  countCpuCores(function(numLineas) {
    //Dividimos por 2 los cores recibidos ya que el OID consultado los muestra duplicados
    maxRepetitions = Math.floor(numLineas/2);

    //Mostramos por cada core, su valor correspondiente
    for (var j = 1; j <= maxRepetitions; j++) {
      desc.push('CPU Core ' + j + ': ');
    }
    
    getBulkOid(oid,nonRepeaters,maxRepetitions, function(data) {

      //Obtenemos el valor correspondiente
      var partes = data.split("|");
      var datos1 = partes[1];

      valormedio = valormedio + (datos1 / 100);

      //Formamos el mensaje y mostramos el valor medio de la CPU
      msg += desc[i]+(datos1)+"% \n";
      if( i == desc.length - 1 )
      {
          bot.sendMessage(getChatId(), msg +"\n Valor medio de la CPU: "+((valormedio/desc.length)*100).toFixed(4)+"%", {parse_mode: "Markdown"});
      }
      i = i+1;
     //bot.sendMessage(getChatId(), "Valor CPU:"+ data);
    });
  });
}

/*
* Función que devuelve la cantidad de cores que tiene el PC y este OID nos muestra los cores duplicados
*/

function countCpuCores(callback) {
  var oid = ['1.3.6.1.2.1.25.3.3.1.2'];
  var nonRepeaters = 0;
  var maxRepetitions = 20;

  getBulkOidCPU(oid, nonRepeaters, maxRepetitions)
  .then((varbindsList) => {
    //console.log(varbindsList+ " y longitud es " +varbindsList.length);
    callback(varbindsList.length);
  })
  .catch((error) => {
    console.error(error);
  });

}




/**
* Get tablaip info
**/
function tablaip() {
    console.log('procesando tabla direcciones ip');
    var msg = "*Tabla de direcciones IP:*\n\n";
    var i = 0;
  var desc = [];
              
  var oid = ['1.3.6.1.2.1.4.20.1.1'];
  var nonRepeaters = 0;
  var maxRepetitions = 0;

  //Obtenemos el numero de IP que tiene un equipo y con ello hacemos tantas repeticiones como IP tenga
  countNumIp(function(numLineas) {
    maxRepetitions = numLineas;
    for (var j = 1; j <= maxRepetitions; j++) {
      desc.push('Num. IP ' + j + ': ');
    }
    
    //Obtenemos todas las IP de un equipo
    getBulkOid(oid,nonRepeaters,maxRepetitions, function(data) {
      var partes = data.split("|");
      var datos1 = partes[1];

      msg += desc[i]+(datos1)+" \n";
      if( i == desc.length - 1 )
      {
          bot.sendMessage(getChatId(), msg, {parse_mode: "Markdown"} );
      }
      i = i+1;

    });
  });
}

/*
* Funcion que devuelve la cantidad de IP que tiene un equipo
*/

function countNumIp(callback) {
  var oid = ['1.3.6.1.2.1.4.20.1.1'];
  var nonRepeaters = 0;
  var maxRepetitions = 30;

  getBulkOidIP(oid, nonRepeaters, maxRepetitions)
  .then((varbindsList) => {
    console.log(varbindsList+ " y longitud es " +varbindsList.length);
    callback(varbindsList.length);
  })
  .catch((error) => {
    console.error(error);
  });

}


/**
* Get uptime info
**/
function uptime() {
    console.log('funcion uptime');
    var msg = "*Tiempo activo: *\n\n";
    getOid(['1.3.6.1.2.1.1.3.0'], function(data) {

        var seconds = Math.round(data/100);
        
        // Calcular horas, minutos y segundos
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var remainingSeconds = seconds % 60;

        var time = hours+' horas, '+minutes+' minutos, '+remainingSeconds +" segundos";

        msg += time+"\n";
        bot.sendMessage(getChatId(), msg, {parse_mode: "Markdown"});
    });
}

/**
 * Get SWInstalled 
 **/
function SWInstalled() {
	console.log('funcion SWInstalled');

	// Borramos el contenido del archivo
	fs.writeFile('./software.txt', '', function(err) {
		if (err) {
			console.log('Error al borrar el archivo:', err);
		} else {
			console.log('Contenido del archivo borrado');
		}
	});
	var nonRepeaters = 0;
	var maxRepetitions = 400;

	var promises = [];


	// Crea una nueva Promise que se resuelve cuando se recibe la respuesta de getBulkOid
	var promise = new Promise((resolve, reject) => {
		getBulkOid(['1.3.6.1.2.1.25.6.3.1.2'], nonRepeaters, maxRepetitions, function(data) {
			var partes = data.split("|");
			var datos1 = partes[1];
			//Si el contenido está vacío no se guarda en el archivo
			if (datos1 != '0.0') {
				fs.writeFile('software.txt', datos1 + "\n", {
					flag: 'a'
				}, function(err) {
					if (err) {
						console.log(err);
						reject(err);
					} else {
						console.log('El archivo software.txt ha sido actualizado');
						resolve(datos1);
					}
				});
			}
		});
	});

	promises.push(promise);

	// Espera a que todas las Promises se resuelvan antes de continuar

	Promise.all(promises).then(values => {
		// Leemos el contenido del archivo generado
		fs.readFile('./software.txt', 'utf-8', (err, datos) => {
			if (err) {
				console.error('Error al leer el archivo software.txt:', err);
				return;
			}

			// Leemos el contenido del otro archivo para la comparación
			fs.readFile('./softwareautorizado.txt', 'utf-8', (err, otroDatos) => {
				if (err) {
					console.error('Error al leer el archivo otroarchivo.txt:', err);
					return;
				}

				// Filtramos solo el software malicioso y le agregamos un número a cada programa
				const softwareMalicioso = datos.split('\n')
					.filter(software => !otroDatos.includes(software))
					.map((software, index) => `${index + 1}. ${software}`);

				// Contamos la cantidad de programas instalados
				const cantidadProgramas = datos.split('\n').length;

				// Enviamos como mensaje el software malicioso encontrado y la cantidad de programas instalados
				const mensaje = `*Software malicioso:* \n\n${softwareMalicioso.join('\n')}\n\n*Cantidad de programas instalados: ${cantidadProgramas}*\n\nEl documento con el software que tiene instalado es:\n`;

				bot.sendMessage(getChatId(), mensaje, {parse_mode: "Markdown"});
				// Envía el archivo de software al bot de Telegram
				bot.sendDocument(chatId, "./software.txt")
			});
		});
	});
}

/**
* Get numoctetos muestra las graficas de los paquetes en la interfaz activa en un determinado tiempo
**/
function numOctetos() {
  console.log('funcion numOctetos');
  //var msg = "Número de paquetes entrantes: ";
  //var msg2 = "Número de paquetes salientes: ";
  //var oid = ['1.3.6.1.2.1.2.2.1.11.45'];
  //var oidOut = ['1.3.6.1.2.1.2.2.1.17.45'];
  var repetitions = 12; // 13 repeticiones para que sean 2 minutos ya que la primera no cuenta al hacerle el delta
  var dataArray = [];
  var labelsArray = [];
  var labelsArray1 = [];
  var dataArrayOut = [];
  var previousValue = 0; // Variable para almacenar el valor anterior
  var previousValueOut = 0; // Variable para almacenar el valor anterior
  var oid1 = 0;
  var oid2 = 0;

  getOidNumOctetos(function(resultado) {

  var partes2 = resultado.split("|");
  oid1 = [partes2[0]];
  oid2 = [partes2[1]];
  
  console.log("Valor obtenido: " + oid1+ " y la oid 2: "+oid2);
  });

  var intervalId = setInterval(function() {

    //Hacemos el get para los paquetes entrantes
    getOid(oid1, function(data) {
      var currentValue = data;
      if (previousValue !== 0) {
        dataArray.push(currentValue - previousValue); // Restar el valor anterior al valor actual para mostrar el delta
        var currentDate = new Date();
        labelsArray.push(currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds());
      }
      previousValue = currentValue; // Actualizar el valor anterior
    });

    //Hacemos el get para los paquetes salientes
    getOid(oid2, function(dataOut) {
      var currentValueOut = dataOut;
      if (previousValueOut !== 0) {
        dataArrayOut.push(currentValueOut - previousValueOut); // Restar el valor anterior al valor actual
        var currentDate1 = new Date();
        labelsArray1.push(currentDate1.getHours() + ":" + currentDate1.getMinutes() + ":" + currentDate1.getSeconds());
      }
      previousValueOut = currentValueOut; // Actualizar el valor anterior
    });

    repetitions--;
    if (repetitions === 0) {
      clearInterval(intervalId);

      // Calcular la media de los valores de dataArray (entrantes) y dataArrayOut (salientes)
      const mediaArray = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const mediaArrayOut = dataArrayOut.reduce((a, b) => a + b, 0) / dataArrayOut.length;

      // Crear gráfica para los paquetes entrantes
      const canvas = createCanvas(600, 400);
      const ctx = canvas.getContext('2d');
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labelsArray,
          datasets: [{
            label: 'Paquetes entrantes',
            data: dataArray,
            borderColor: 'blue',
            borderWidth: 1
          }, {
            label: 'Media de paquetes entrantes',
            data: Array(dataArray.length).fill(mediaArray),
            borderColor: 'green',
            borderWidth: 1,
            borderDash: [10, 10]
          }]
        },
        options: {
          scales: {
            y: {
              ticks: {
                beginAtZero: true
              }
            }
          }
        }
      });

      // Crear gráfica para los paqutes salientes
      const canvas1 = createCanvas(600, 400);
      const ctx1 = canvas1.getContext('2d');
      const chart2 = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: labelsArray1,
          datasets: [{
            label: 'Paquetes salientes',
            data: dataArrayOut,
            borderColor: 'red',
            borderWidth: 1
          }, {
            label: 'Media de paquetes salientes',
            data: Array(dataArrayOut.length).fill(mediaArrayOut),
            borderColor: 'green',
            borderWidth: 1,
            borderDash: [10, 10]
          }]
        },
        options: {
          scales: {
            y: {
              ticks: {
                beginAtZero: true
              }
            }
          }
        }
      });
      // Obtener imagen de la gráfica como un buffer de PNG
      const buffer = canvas.toBuffer('image/png');
      // Obtener imagen de la gráfica como un buffer de PNG
      const buffer2 = canvas1.toBuffer('image/png');
      

      // Enviar imagen de la gráfica como un mensaje de foto en Telegram
      bot.sendPhoto(getChatId(), buffer);
      // Enviar imagen de la gráfica como un mensaje de foto en Telegram
      bot.sendPhoto(getChatId(), buffer2);

      // Eliminar la instancia de la gráfica para evitar fugas de memoria
      chart.destroy();
      // Eliminar la instancia de la gráfica para evitar fugas de memoria
      chart2.destroy();
    }
  }, 10500); // intervalo de 10 segundos

}

/*
* Funcion numOctetoscontinua2 que monitoriza continuamente hasta que se supera un umbral y manda una alerta
*/
async function numOctetoscontinua2() {
  console.log('funcion numOctetoscontinua2');
  var repetitions = 7; // 6 repeticiones de 10 segundos = 1 minutos
  var dataArray = [];
  var labelsArray = [];
  var labelsArray1 = [];
  var dataArrayOut = [];
  var previousValue = 0; // Variable para almacenar el valor anterior
  var previousValueOut = 0; // Variable para almacenar el valor anterior
  var currentValue = 0;
  var oid1 = 0;
  var oid2 = 0;

  getOidNumOctetos2(function(resultado) {

  var partes2 = resultado.split("|");
  oid1 = [partes2[0]];
  oid2 = [partes2[1]];
  
  console.log("Valor obtenido: " + oid1+ " y la oid 2: "+oid2);
  });

  var intervalId = setInterval(function() {
    getOid(oid1, function(data) {
      var currentValue = data;
      if (previousValue !== 0) {
        dataArray.push(currentValue - previousValue); // Restar el valor anterior al valor actual
        var currentDate = new Date();
        labelsArray.push(currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds());
        
        var mediaArray = dataArray.reduce((a, b) => a + b, 0) / (dataArray.length - 1);

        if (!isFinite(mediaArray)) {
          mediaArray = (currentValue - previousValue);
        }

        //bot.sendMessage(getChatId(), "El numero de peticiones es de " + (currentValue - previousValue) / 1000000 + " MB/s");
        console.log("El numero de peticiones es de " + (currentValue - previousValue) / 1000000 + " MB/s y la media es:"+mediaArray/ 1000000);
        if ((currentValue - previousValue) > 3 * mediaArray) {
          bot.sendMessage(getChatId(), "*¡ALERTA!* El valor actual de octetos entrantes supera dos veces la media.", {parse_mode: "Markdown"});
          
          // Crear gráfica
          const canvas = createCanvas(600, 400);
          const ctx = canvas.getContext('2d');
          const chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labelsArray,
              datasets: [{
                label: 'Octetos entrantes',
                data: dataArray,
                borderColor: 'blue',
                borderWidth: 1
              }, {
                label: 'Media de octetos entrantes',
                data: Array(dataArray.length).fill(mediaArray),
                borderColor: 'green',
                borderWidth: 1,
                borderDash: [10, 10]
              }]
            },
            options: {
              scales: {
                y: {
                  ticks: {
                    beginAtZero: true,
                    callback: function(value) {
                      return (value / 1000000) + " Mb/s";
                    }
                  }
                }
              }
            }
          });
  
          // Obtener imagen de la gráfica como un buffer de PNG
          const buffer = canvas.toBuffer('image/png');
  
          bot.sendPhoto(getChatId(), buffer);
  
          // Eliminar la instancia de la gráfica para evitar fugas de memoria
          chart.destroy();
          clearInterval(intervalId);
        }
      }
      previousValue = currentValue; // Actualizar el valor anterior
    });
  
    repetitions--;
    if (repetitions === 0) {
      clearInterval(intervalId);
    }
  }, 11000); // intervalo de 10 segundos

} 

/**
 * Get oid activo para numero de paquetes entrantes y salientes
**/
function getOidNumOctetos(callback) {
  var oid1 = ['1.3.6.1.2.1.2.2.1.7']; // Estado de la interfaz
  var oid2 = ['1.3.6.1.2.1.2.2.1.8']; // Estado administrativo de la interfaz
  var oid3 = ['1.3.6.1.2.1.2.2.1.11']; // Número de paquetes recibidos
  var oid4 = ['1.3.6.1.2.1.2.2.1.17']; // Número de paquetes transmitidos

  var nonRepeaters = 0;
  var maxRepetitions = 20;
  var alreadyPrinted = false;

  // Consultar los valores de todas las interfaces en la tabla ifTable
  getBulkOid(oid1, nonRepeaters, maxRepetitions, function(status) {
    var partes = status.split("|");
    var valor = partes[1];
    if(valor == '1'){
      getBulkOid(oid2, nonRepeaters, maxRepetitions, function(adminStatus) {
        var partes1 = adminStatus.split("|");
        var valor1 = partes1[1];
        if(valor1 == '1'){
          getBulkOid(oid3, nonRepeaters, maxRepetitions, function(inPkts) {
            var partes2 = inPkts.split("|");
            var oid1 = partes2[0];
            var valor2 = partes2[1];
            if(valor2 > 1000){
              getBulkOid(oid4, nonRepeaters, maxRepetitions, function(outPkts) {
                var partes3 = outPkts.split("|");
                var oid2 = partes3[0];
                var valor3 = partes3[1];
                // Comprobar cada fila de la tabla ifTable
                if (valor3 > 1000) {
                  // La interfaz está activa y se están recibiendo y transmitiendo datos
                  if (!alreadyPrinted) {
                    console.log('Oid de la interfaz activa paquetes entrantes: '+oid1 );
                    console.log('Oid de la interfaz activa paquetes salientes: '+oid2 );
                    callback(oid1 + "|" + oid2);
                    alreadyPrinted = true;
                  }
                }
              });
            }
          });
        }
      });
    }
  });
}

/**
 * Get oid activo para numero de octetos entrantes y salientes
**/
function getOidNumOctetos2(callback) {
  var oid1 = ['1.3.6.1.2.1.2.2.1.7']; // Estado de la interfaz
  var oid2 = ['1.3.6.1.2.1.2.2.1.8']; // Estado administrativo de la interfaz
  var oid3 = ['1.3.6.1.2.1.2.2.1.10']; // Número de octetos recibidos
  var oid4 = ['1.3.6.1.2.1.2.2.1.16']; // Número de octetos transmitidos

  var nonRepeaters = 0;
  var maxRepetitions = 20;
  var alreadyPrinted = false;

  // Consultar los valores de todas las interfaces en la tabla ifTable
  getBulkOid(oid1, nonRepeaters, maxRepetitions, function(status) {
    var partes = status.split("|");
    var valor = partes[1];
    if(valor == '1'){
      getBulkOid(oid2, nonRepeaters, maxRepetitions, function(adminStatus) {
        var partes1 = adminStatus.split("|");
        var valor1 = partes1[1];
        if(valor1 == '1'){
          getBulkOid(oid3, nonRepeaters, maxRepetitions, function(inOctets) {
            var partes2 = inOctets.split("|");
            var oid1 = partes2[0];
            var valor2 = partes2[1];
            if(valor2 > 1000){
              getBulkOid(oid4, nonRepeaters, maxRepetitions, function(outOctets) {
                var partes3 = outOctets.split("|");
                var oid2 = partes3[0];
                var valor3 = partes3[1];
                // Comprobar cada fila de la tabla ifTable
                if (valor3 > 1000) {
                  // La interfaz está activa y se están recibiendo y transmitiendo datos
                  if (!alreadyPrinted) {
                    console.log('Oid de la interfaz activa octetos entrantes: '+oid1 );
                    console.log('Oid de la interfaz activa octetos salientes: '+oid2 );
                    callback(oid1 + "|" + oid2);
                    alreadyPrinted = true;
                  }
                }
              });
            }
          });
        }
      });
    }
  });
}

/**
* Funcion genérica para ejecutar un GET
**/
function getOid(oid, callback) {
    if( !getSession() )
    {
        //Si no se ha establecido la conexión con una IP, se manda este mensaje
        bot.sendMessage(chatId, "No se ha establecido la conexión correctamente. Usa /connect o /scan .");
    }
    else
    {
        getSession().get (oid, function (error, varbinds) {
            if (error) {
                console.error (error);
            } else {
                for (var i = 0; i < varbinds.length; i++)
                if (snmp.isVarbindError (varbinds[i])) {
                    console.error (snmp.varbindError (varbinds[i]));
                    bot.sendMessage(chatId, "ERROR:\n "+snmp.varbindError (varbinds[i]));
                } else {
                    console.log (varbinds[i]);
                    callback(varbinds[i].value);
                }
            }
        });
    }
}

/**
* Funcion genérica para ejecutar un GETNEXT
**/
function getNextOid(oid, callback) {
    if( !getSession() )
    {
        //Si no se ha establecido la conexión con una IP, se manda este mensaje
        bot.sendMessage(chatId, "No se ha establecido la conexión correctamente. Usa /connect o /scan .");
    }
    else
    {
        getSession().getNext (oid, function (error, varbinds) {
            if (error) {
                console.error (error);
            } else {

                for (var i = 0; i < varbinds.length; i++)
                if (snmp.isVarbindError (varbinds[i])) {
                    console.error (snmp.varbindError (varbinds[i]));
                    bot.sendMessage(chatId, "ERROR:\n "+snmp.varbindError (varbinds[i]));
                } else {
                    callback(varbinds[i].value);
                }
            }
        });
    }
}

/**
* Funcion genérica para ejecutar un GETBULK que devuelve el OID y el valor de ese OID
**/
function getBulkOid(oid,nonRepeaters,maxRepetitions, callback) {
  if( !getSession() )
  {
      //Si no se ha establecido la conexión con una IP, se manda este mensaje
      bot.sendMessage(chatId, "No se ha establecido la conexión correctamente. Usa /connect o /scan .");
  }
  else
  {
      
      
      getSession().getBulk (oid, nonRepeaters, maxRepetitions, function (error, varbinds) {
          if (error) {
              console.error (error);
          } else {
              
               // step through the non-repeaters which are single varbinds
              for (var i = 0; i < nonRepeaters; i++) {
              if (i >= varbinds.length)
                 break;

              if (snmp.isVarbindError (varbinds[i])){
                  console.error (snmp.varbindError (varbinds[i]));
              }else{
                  callback(varbinds[i].value);
                  console.log (varbinds[i].oid + "|" + varbinds[i].value);
                  }
              } 

              // then step through the repeaters which are varbind arrays
              for (var i = nonRepeaters; i < varbinds.length; i++) {
              for (var j = 0; j < varbinds[i].length; j++) {
                  
              if (snmp.isVarbindError (varbinds[i][j]))
                  console.error (snmp.varbindError (varbinds[i][j]));
              else
                  //console.log (varbinds[i][j].oid + "|" + varbinds[i][j].value);
                  callback(varbinds[i][j].oid + "|" + varbinds[i][j].value);
                  
              }
              }
              

          }
          
    });
  }
}

/*
* Funcion genérica para ejecutar un GETBULK específica para la funcion de la CPU
*/

function getBulkOidCPU(oid, nonRepeaters, maxRepetitions) {
  return new Promise((resolve, reject) => {
    if (!getSession()) {
      //Si no se ha establecido la conexión con una IP, se manda este mensaje
      reject(new Error("No se ha establecido la conexión correctamente. Usa /connect o /scan ."));
    } else {
      const varbindsList = [];

      const callback = (varbind) => {
        varbindsList.push(varbind);
        if (varbindsList.length === oid.length) {
          resolve(varbindsList);
        }
      };

      oid.forEach((oidElem) => {
        getSession().getBulk(oid, nonRepeaters, maxRepetitions, function (error, varbinds) {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            // step through the non-repeaters which are single varbinds
            for (var i = 0; i < nonRepeaters; i++) {
              if (i >= varbinds.length) break;

              if (snmp.isVarbindError(varbinds[i])) {
                console.error(snmp.varbindError(varbinds[i]));
                reject(snmp.varbindError(varbinds[i]));
              } else {
                callback(varbinds[i].oid + "|" + varbinds[i].value);
              }
            }

            // then step through the repeaters which are varbind arrays
            for (var i = nonRepeaters; i < varbinds.length; i++) {
              for (var j = 0; j < varbinds[i].length; j++) {
                if (snmp.isVarbindError(varbinds[i][j])) {
                  console.error(snmp.varbindError(varbinds[i][j]));
                  reject(snmp.varbindError(varbinds[i][j]));
                } else {
                  //Compara que la oid sea igual que la que se le da como parametro para no pasarse a la siguiente columna o tabla
                  var oidcompara = varbinds[i][j].oid.substring(0, varbinds[i][j].oid.lastIndexOf('.'));
                  if (oidcompara == oid) {
                    callback(varbinds[i][j].oid + "|" + varbinds[i][j].value);                    
                  }
                }
              }
            }
          }
        });
      });
    }
  });
}

/*
* Funcion genérica para ejecutar un GETBULK especifico para la funcion de la cantidad de IP que tiene el equipo
*/

function getBulkOidIP(oid, nonRepeaters, maxRepetitions) {
  return new Promise((resolve, reject) => {
    if (!getSession()) {
      //Si no se ha establecido la conexión con una IP, se manda este mensaje
      reject(new Error("No se ha establecido la conexión correctamente. Usa /connect o /scan ."));
    } else {
      const varbindsList = [];

      const callback = (varbind) => {
        varbindsList.push(varbind);
        if (varbindsList.length === oid.length) {
          resolve(varbindsList);
        }
      };

      oid.forEach((oidElem) => {
        getSession().getBulk(oid, nonRepeaters, maxRepetitions, function (error, varbinds) {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            // step through the non-repeaters which are single varbinds
            for (var i = 0; i < nonRepeaters; i++) {
              if (i >= varbinds.length) break;

              if (snmp.isVarbindError(varbinds[i])) {
                console.error(snmp.varbindError(varbinds[i]));
                reject(snmp.varbindError(varbinds[i]));
              } else {
                callback(varbinds[i].oid + "|" + varbinds[i].value);
              }
            }

            // then step through the repeaters which are varbind arrays
            for (var i = nonRepeaters; i < varbinds.length; i++) {
              for (var j = 0; j < varbinds[i].length; j++) {
                if (snmp.isVarbindError(varbinds[i][j])) {
                  console.error(snmp.varbindError(varbinds[i][j]));
                  reject(snmp.varbindError(varbinds[i][j]));
                } else {
                  //Compara que la oid sea igual que la que se le da como parametro para no pasarse a la siguiente columna o tabla
                  //var oidcompara = varbinds[i][j].oid.substring(0, varbinds[i][j].oid.lastIndexOf('.'));
                  var oidcompara = varbinds[i][j].oid.substring(0, varbinds[i][j].oid.lastIndexOf('.'));
                  oidcompara = oidcompara.substring(0, oidcompara.lastIndexOf('.'));
                  oidcompara = oidcompara.substring(0, oidcompara.lastIndexOf('.'));
                  oidcompara = oidcompara.substring(0, oidcompara.lastIndexOf('.'));

                  console.log(oidcompara);
                  if (oidcompara == oid) {
                    callback(varbinds[i][j].oid + "|" + varbinds[i][j].value);                    
                  }
                }
              }
            }
          }
        });
      });
    }
  });
}


/**
* Funcion genérica para ejecutar un SET
**/
function setOid(oid, valor, callback) {
    if( !getSession() )
    {
        //Si no se ha establecido la conexión con una IP, se manda este mensaje
        bot.sendMessage(chatId, "No se ha establecido la conexión correctamente. Usa /connect o /scan .");
    }
    else
    {
        var varbinds = [
            {
                oid: oid,
                type: snmp.ObjectType.OctetString,
                value: valor
            }
        ];
        getSession().set (varbinds, function (error, varbinds) {
            if (error) {
                console.error (error);
            } else {
                for (var i = 0; i < varbinds.length; i++)
                if (snmp.isVarbindError (varbinds[i])) {
                    console.error (snmp.varbindError (varbinds[i]));
                    bot.sendMessage(chatId, "ERROR:\n "+snmp.varbindError (varbinds[i]));
                } else {
                    callback(varbinds[i].value);
                }
            }
        });
    }
}

/**
* Cuando se recibe /scan, se ejecuta la funcion para escanear las IP que tienen SNMP
**/
bot.onText(/\/scan/, function (msg, match) {
  setCommand('scan');
  setChatId(msg.chat.id);

  const ipRange = '192.168.100.';
  const community = 'public';
  const port = 161;

  bot.sendMessage(chatId, "Se va a proceder al escaneo de dispositivos SNMP durante 5 segundos");

  //Se llama a esta funcion en la que se hace una peticion al puerto 161 que es el de SNMP y si responde, se guarda su IP
  scanDevices(ipRange, community, port)
  .then(devicesFound => {
      console.log('Dispositivos encontrados:', devicesFound);
      bot.sendMessage(chatId, 'Se encontraron los siguientes dispositivos:\n'+devicesFound.join('\n')).then(() => {
          const keyboard = {
              inline_keyboard: []
          };

          devicesFound.forEach(ip => {
              keyboard.inline_keyboard.push([
                  { text: ip, callback_data: 'session ' + ip }
              ]);
          });

          bot.sendMessage(chatId, 'Seleccione una dirección IP:', { reply_markup: keyboard });
      });
  })
  .catch(error => {
      console.error('Error al escanear dispositivos:', error);
  });
});

bot.on('callback_query', function (callbackQuery) {
  const data = callbackQuery.data.split(' ');
  const command = data[0];
  const ip = data[1];

  if (command === 'session') {
      commandSession(callbackQuery.message.chat.id, ip);
  }
});

/**
 * Funcion para escanear dispositivos que dispongan de SNMP en la red
 */
function scanDevices(ipRange, community, port) {
  const devicesFound = [];

  // Recorre el rango de direcciones IP
  for (let i = 1; i <= 255; i++) {
      const x = Math.floor(i / 256);
      const y = i % 256;
      const ipAddress = ipRange + y;


    // Crea un objeto Session para la dirección IP actual
    const session = snmp.createSession(ipAddress, community, { port: port });

    // Realiza una consulta SNMP para la dirección IP actual
    session.get(['1.3.6.1.2.1.1.5.0'], function (error, varbinds) {
      /*if (error) {
        console.error(error);
        return;
      }*/

      // Si la consulta fue exitosa, agrega la dirección IP a la lista de dispositivos encontrados
      devicesFound.push(ipAddress);
    });
  }


  // Espera a que se completen todas las consultas antes de devolver la lista de dispositivos encontrados
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(devicesFound);
    }, 5000);
  });
}


/**
* Cuando se escribe /connect, se puede introducir una IP conocida en el teclado y conectarse directamente a ella
**/
bot.onText(/\/connect/, function (msg, match) {
    setCommand('connect');
    setChatId(msg.chat.id);
    bot.sendMessage(msg.from.id, 'Introduzca la direccion IP del agente SNMP');
});

/**
* Cuando se establece una conexión correcta, se manda este mensaje
**/
var commandSession = function(chatId, ip) {
    setSession(snmp.createSession(ip, "public"));
    bot.sendMessage(chatId, "Se ha establecido una nueva conexión SNMP con la dirección "+ip+" . Y se ha activado una alarma si se supera 3 veces la media de octetos entrantes en la interfaz activa");
    console.log('Se ha establecido una nueva conexión SNMP con la dirección %s . Y se ha activado una alarma si se supera 3 veces la media de octetos entrantes en la interfaz activa', ip);

    //Se van a ejecutar estas funciones para que monitorize todo el tiempo que estemos conectados a un equipo
    numOctetoscontinua2();
    //Se ejecura periodicamente cada 80 segundos
    setInterval(numOctetoscontinua2, 80000);

}



