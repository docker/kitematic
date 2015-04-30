$scriptpath = $MyInvocation.MyCommand.Path
$dir = Split-Path $scriptpath
$BasePath = $dir + '\..\'
$packageJson = get-content ($BasePath + 'package.json')
[System.Reflection.Assembly]::LoadWithPartialName("System.Web.Extensions") > $null
$serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$packageJsonContent = $serializer.DeserializeObject($packageJson)
$webclient = New-Object System.Net.WebClient

$DOCKER_MACHINE_CLI_VERSION = $packageJsonContent['docker-machine-version']
$DOCKER_MACHINE_CLI_FILE = 'docker-machine-' + $DOCKER_MACHINE_CLI_VERSION + '.exe'
$DOCKER_CLI_VERSION = $packageJsonContent['docker-version']
$DOCKER_CLI_FILE = 'docker-' + $DOCKER_CLI_VERSION + '.exe'


if(-Not (test-path ($BasePath + '\resources\' + $DOCKER_CLI_FILE))) {
    echo "-----> Downloading Docker CLI..."
    $source = "https://master.dockerproject.com/windows/amd64/docker.exe"
    $destination = $BasePath + "\resources\" + $DOCKER_CLI_FILE
    $webclient.DownloadFile($source, $destination)
}

if(-Not (test-path ($BasePath + '\resources\' + $DOCKER_MACHINE_CLI_FILE))) {
    echo "-----> Downloading Docker Machine CLI..." 
    $source = "https://github.com/docker/machine/releases/download/v0.1.0/docker-machine_windows-amd64.exe"
    $destination = $BasePath + "\resources\" + $DOCKER_MACHINE_CLI_FILE 
    $webclient.DownloadFile($source, $destination)
}