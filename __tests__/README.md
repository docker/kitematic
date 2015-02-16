# Kitematic Testing

## Unit Tests

Simply run `npm test`

## Integration Tests

*Coming Soon*

## Manual Setup Tests

Use the reset script under `__tests__/util/reset` to reset your environment for each manual test. WARNING: This will erase your existing VirtualBox, Docker & Kitematic installation.

The expected result for all test cases is that the setup finishes and an HTML container can be created, and that there are no error logs in the output of Kitematic.

### Test Cases

- Clean state
- Clean state with an old version of VirtualBox installed and running `4.3.16<`
- Clean state with VirtualBox installed `4.3.18+`
- Clean state with an old Boot2Docker VM & installation `0.12+`
- Clean state with the latest Boot2Docker VM & installation
- `FAILING` Clean state with an aborted Boot2Docker VM
