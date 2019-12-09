
# Overview  
# Prerequisites  
1. JAVA SDK 11 or higher  
2. Scala 2.13 or above  

**Note:** The project is developed and tested on a Unix based OS
# How to run  
The project has two main files:  
1. ServerLaunch - Launches the IPC server to listen to communications  
2. InstrumLauch - Launches the instrumentation for a selected project  
  
Below are the steps to be followed to run the project:  
1. Run the file `ServerLauch.scala`. This should start a server at `127.0.0.1:8080`. Make sure that this port is free   
or else the server won't start. This file should be run first and has to be started only once for running any number of   
instrumentations. Donot close the terminal window in which this file is run  
2. Run the file `InstrumLaunch.scala` to run the instrumentation. You will be provided with a list of project configuration   
files available to the instrumenter. You can choose which project to run. Running the instrumenter for more than once on the  
same source file may cause unexpected results. This project already has a `Pathfinder` and `Matrix Rotation` program which   
can be used for test purposes.   
3. After each run two timestamped files will be found in the `tracefiles` directory in the project root. The file with   
`binding_` will have the formatted data of the hashtable for each variable and `trace_` will have running data of each  
instrum statement executed.  
  
`sbt` command line can also be used to run the project. Running the project from the root will provide you with option to  
select which class has to run. Run both the files in two separate terminals in the order described above.  
# How to add a new project for instrumentation  
Each project used is based on Ant build. Ant is used for its simplicity to bootstrap a new project  
quickly. Any tool build which gives out `.class` files as output can be swapped out instead of Any. Since using Ant   
each project is expected to have a `build.xml` file with the below specification:  
1. Default target is `compile`  
2. A `javac` node is defined with the `destdir` property set to a folder.  
3. Two dependency jars as defined below are specified in the classpath node. Only declaration for the `jars` in the build   
file is needed. The original files are copied automatically by the launcher program.   
	```xml
	<!--Below two lines are included as per specification--> 
	<pathelement path="jars/nv-websocket-client-2.9.jar"/>         
	<pathelement path="jars/json-20190722.jar"/>
	```
Below is an example of a `build.xml` which can be used as a starting point  
```xml  
<project default="compile">  
	<target name="compile"> <mkdir dir="target"/> 
		<javac srcdir="src" destdir="target"> 
			<classpath> 
				<pathelement path="jars/stdlib(3).jar"/> 
				<!--Below two lines are included as per specification--> 
				<pathelement path="jars/nv-websocket-client-2.9.jar"/>         
				<pathelement path="jars/json-20190722.jar"/>   
			</classpath>  
		</javac> 
	</target>
</project>  
```  
To add a new project for instrumentation perform the below steps:  
1. Make sure your project is Ant buildable.  
1. Add a configuration file to the folder `config/instrum`. This a configuration file and should have the extension `.conf`.  
Each parameter in the configuration file is shown below: All parameters are mandatory and the program cannot procced without   
setting each of the below parameters  
   1. rootRelativetoInstrumDir - Set this to `true` if the new project foler is saved inside the instrumentation project  
    directory. Else set this to `false`.  
   2. root - Specify path to the root of your project. If you set `true` for `rootRelativetoInstrumDir` this path should be   
    relative else you need an absolute path to be specified.  
   3. srcDir - Specify path to top level directory which has `.java` code files. This is to be set relatively to the `root`  
  parameter  
   4. targetDir - Specify where to find the `.class` files produced by the Ant builder. This is to be set relatively to the `root`  
  parameter  
   5. jarFolder - Specify the folder where your `jars` are saved. This should be the folder part of your `classpath` specification  
    in the `build.xml`. This is to be set relatively to the `root` parameter.  
   6. buildFile - Specify where your `build.xml` file is. This is to be set relatively to the `root` parameter.  
   7. mainClass - Give the qualified name including the package structure of your main class  
   8. arguments - This is a list of list. The inner list is separated by commas and each inner list consists of the arguments  
    to be passed to the instrumented program.  
      
See for a sample `pathfinder.conf` file for a project saved inside the instrumentation project in the path `projects/project1`  
```
compile{
  # Set this to true if the project root directory
  # is inside the instrum project directory and the provide
  # relative path to the project folder
  rootRelativetoInstrumDir = true
  root = "projects/project1"
  # Everything below this line is relative to the
  # project root
  srcDir = "src"
  targetDir = "target"
  jarFolder = "jars"
  buildFile = "build.xml"
}

run {
  # Provide the qualified main class
  mainClass = "PathFindingOnSquaredGrid"
  # Provide input parameters
  arguments = [
    [10 0.3 0 0 9 9]
  ]
}
``` 

See for a sample `pathfinder.conf` file for a project saved at `/home/sherryl/Desktop/project1`  
```
compile{
  # Set this to true if the project root directory
  # is inside the instrum project directory and the provide
  # relative path to the project folder
  rootRelativetoInstrumDir = false
  root = "/home/sherryl/Desktop/project1"
  # Everything below this line is relative to the
  # project root
  srcDir = "src"
  targetDir = "target"
  jarFolder = "jars"
  buildFile = "build.xml"
}

run {
  # Provide the qualified main class
  mainClass = "PathFindingOnSquaredGrid"
  # Provide input parameters
  arguments = [
    [10 0.3 0 0 9 9]
  ]
}
```  
3. Make sure the project is in the path you specified as `root` and you are good to run the code.  
# Basic Troubleshooting  
1. This project needs port `8080` to be free to run. If you get an `Address already in use` make sure to free the port.  
For a Unix system you can run the command `sudo lsof -i:8080` and then kill the PID blocking the port.  
2. If you get a `Failed to connect to 'localhost:8080'` error when running the `InstrumLaunch` make sure you have run   
`ServerLaunch` and the same is running.  
# Technical Design  
Below is the overall view of the Instrumenter system and overview of all components:  
![Overall Architecture](img/architecture.jpg)  
  
##### Component Details  
###### Launcher Program  
Launcher program is divided into two:  
###### 1. Instrumenter  
This component deals with reading files in a JAVA project, instrumenting the code and launch JVM instances for each set   
of input. Main components are:  
* Parser : Parser will run over the code and rewrites certain control structures which has single statements to blocks.  
* Instrumenter : Visitors are used to visitor over predefined statements and expressions, find their names, binding in   
the current scope and value currently held. The values found are then passed to `TemplateClass.instrum()` method for   
being sent to the launcher program.  
* AntBuilder : Ant is used as the build tool. Each project passed should have a `build` file. Ant is used for its simplicity.  
Ant can be swapped out for any other build tool. The output of this step is `.class` files and that's all is needed from   
this step. The `.class` files will be saved into a predefined folder.  
* JVMLauncher : JDI is used to launch separate instances of JVM for each set of inputs in the selected project  
###### 2. IPC Server & Trace Writer  
This component has two main functions  
* IPC Server - This server needs to be started before the instrumenter is run. Server listens to `127.0.0.1:8080` for  
incoming messages. Each message is in JSON format in the below schema:  
```json  
{  
  line: Int,  
  statementType: String,  
  data: [{type:  String, binding: String, value:  String}]  
}  
```  
Each JSON thus obtained is parsed and a hastable is maintained with the unique identifier as `binding`. And the JSON is  
saved. Also a running trace is maintained to store the unprocessed JSON data which comes from the JVM instance.   
A hashtable and trace maintained for each connected client and the data is moved to timestamp named text file when each  
client is disconnected.  
* JSON Parser & File Writer : Has code to parse each JSON coming to the system and write files at the disconnection of   
each client.  
###### JVM Instance  
Each project is passed to a JVM instace. The instrumented code has two main components:  
* Original Code with Instrumentation statements. Each instrumented statement will be of the form   
`TemplateClass.instrum(int line, String typeofStatement, AP... parameters)`.  
* A `TemplateClass` with static members. When the static class is initialized a unique web socket connection is made  
to the launcher program. This connection will be used for IPC. Every `instrum` method executed will send a JSON payload  
to the launcher program for processing and saving.
