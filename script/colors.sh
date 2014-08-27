green='\033[00;32m'
purple='\033[00;35m'
blue='\033[00;34m'
red='\033[00;31m'
function cecho {
  local default_msg="No message passed."
  message=${1:-$default_msg}   # Defaults to default message.
  color=${2:-$green}

  echo -e -n "$color$message"
  echo -e '\033[0m'
}  
