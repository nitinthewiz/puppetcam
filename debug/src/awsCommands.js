const AWS = require('aws-sdk');
const fs = require('fs');
const Path = require('path');


var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {
        Bucket: 'url-video'
    }
});

module.exports = {
    uploadFile: uploadFile
};
async function uploadFile({filePath}) {
    return new Promise((resolve, reject) => {
        //Read file
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', function (err) {
            reject(err);
        });
        //Set new data
        const uploadParams = { 
            Key: Path.basename(filePath), 
            Body: fileStream, 
            ACL: 'public-read' 
        };

        // call S3 to retrieve upload file to specified bucket
        s3.upload(uploadParams).promise().then(data => {
            resolve(data);
        });
    })
}