$scriptpath = $MyInvocation.MyCommand.Path
$dir = Split-Path $scriptpath
$BasePath = $dir + '\..\'
$packageJson = get-content ($BasePath + 'package.json')
[System.Reflection.Assembly]::LoadWithPartialName("System.Web.Extensions") > $null
$serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$packageJsonContent = $serializer.DeserializeObject($packageJson)
$webclient = New-Object System.Net.WebClient

$DOCKER_MACHINE_CLI_VERSION = $packageJsonContent['docker-machine-version']
$DOCKER_CLI_VERSION = $packageJsonContent['docker-version']


if(-Not (test-path ($BasePath + '\resources\docker'))) {
    echo "-----> Downloading Docker CLI..."
    $source = "https://master.dockerproject.com/windows/amd64/docker.exe"
    $destination = $BasePath + "\resources\docker"
    $webclient.DownloadFile($source, $destination)
}

if(-Not (test-path ($BasePath + '\resources\docker-machine'))) {
    echo "-----> Downloading Docker Machine CLI..."
    $source = "https://github.com/docker/machine/releases/download/v" + $DOCKER_MACHINE_VERSION+ "/docker-machine_windows-amd64.exe"
    $destination = $BasePath + "\resources\docker-machine"
    $webclient.DownloadFile($source, $destination)
}
