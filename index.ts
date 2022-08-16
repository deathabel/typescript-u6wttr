import { from } from 'rxjs';

interface String {
  join(value: string): string;
}
String.prototype.join = (value: string) => this + value;

function request(method, url) {
  return from(
    new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: xhr.status,
          statusText: xhr.statusText,
        });
      };
      xhr.send();
    })
  );
}

function renderGrid(data: any) {
  const gridElement = document.querySelector('.grid');
  const titleElement = gridElement.querySelector('.grid-title');
  let titleHtml = titleElement.innerHTML;
  const contentElement = gridElement.querySelector('.grid-row');
  let contentHtml = contentElement.innerHTML;
  let titleTemplate = '',
    contentTemplate = '';
  for (let i = 0; i < data.length; i++) {
    let templateHtml = i === 0 ? titleHtml : contentHtml;
    for (const col in data[i]) {
      templateHtml = templateHtml.replace(
        new RegExp(`\\{\\{${col}\\}\\}`, 'g'),
        data[i][col]
      );
    }
    if (i === 0) {
      titleTemplate += templateHtml;
    } else {
      contentTemplate += templateHtml;
    }
  }
  titleElement.innerHTML = titleTemplate;
  contentElement.innerHTML = contentTemplate;
}

request(
  'get',
  'https://raw.githubusercontent.com/deathabel/typescript-u6wttr/RxjsDemo/data.json'
).subscribe(renderGrid);
