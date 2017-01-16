# Amazon SES mail grabber

This project is a simplistic solution to recieving mail with Amazon SES. It's implemented using SES's delivery of mail to an S3 bucket, with the PUT triggering an SNS notification to an HTTP(S) endpoint. The notification causes a single message to be fetched, placed into an existing maildir, and presumably passed either directly to an email client, or to e.g., an IMAP server.

Configuration is minimal, and found in the config object at the top of index.js, the default Maildir location is based on the expectation that this script is run as the user "sesmail" on a server placing mail in ~/Maildir. AWS credentials capable of reading the destination S3 bucket should be placed in [~/.aws/credentials](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html). AWS must be configured both to allow SES to [write to your S3 bucket](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/receiving-email-permissions.html) and to pass [event notifications](http://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html) from the S3 bucket to SNS.

TODO:
* Currently no tracking of S3 objects is done outside of SNS notifications. Any mail recieved while this script is not running will remain untouched in the S3 bucket. Obviously this is undesireable for a production mail environment.
